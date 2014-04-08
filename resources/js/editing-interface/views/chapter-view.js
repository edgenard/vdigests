
/*global define */
define(["backbone", "underscore", "jquery", "text!templates/chapter-template.html", "editing-interface/views/compound-view", "editing-interface/views/section-view", "editing-interface/views/collection-view", "editing-interface/utils/utils", "editing-interface/models/thumbnail-model"], function (Backbone, _, $, tmpl, CompoundBackboneView, SectionView, CollectionView, Utils, ThumbnailModel) {

  var consts = {
    sectionWrapClass: "summary-column",
    viewClass: "chapter row",
    absSummaryClass: "abs-summary"
  };

  var playOneVideo = function (vid, time) {
    vid.currentTime = time;
    $(document.body).find("video").each(function (i, vid) {
      console.log(vid);
      vid.pause();
    });
    vid.play();
  };

  return CompoundBackboneView.extend({
    template: _.template(tmpl),
    className: consts.viewClass,

    events: {
      'keyup .chapter-header input': function (evt) {
        var thisView = this,
            $curTar = $(evt.currentTarget);
        thisView.set("title", $curTar.val());
      }
    },

    /**
     * Only render the summaries (avoid re-rendering the video)
     */
    renderSummariesOnly: function () {
      var thisView = this;
      thisView.assign(thisView.getAssignedObject());
    },

    initialize: function () {
      var thisView = this,
          thisModel = thisView.model;

      // 'add' section listener
      thisView.listenTo(thisView.model.get("sections"), "add", function (newSec) {
        thisView.assign(thisView.getAssignedObject());
        // pause to let other events finish
        window.setTimeout(function () {
          thisView.$el.find("#" + newSec.cid + " ." + consts.absSummaryClass).focus();
          var $vid = thisView.$el.find("video");
          Utils.seekThenCaptureImgTime($vid, newSec.get("startWord").get("start"), function (newImgData) {
            newSec.set("thumbnail", new ThumbnailModel({data: newImgData}));
          });
        }, 200);
      });

      // 'remove' section listener
      thisView.listenTo(thisModel.get("sections"), "remove", function (remSec) {
        var nsecs = thisView.model.get("sections").length;
        if (nsecs === 0) {
          // we're out of sections: delete the chapter
          thisView.$el.find("video").get(0).pause();
          thisModel.collection.remove(thisModel);
          thisModel.get("startWord").set("startChapter", false);
          thisModel.get("startWord").set("startSection", false);
          thisView.remove();
        } else if (remSec.get("startWord").cid === thisModel.get("startWord").cid){
          // we deleted the leading section but have another section that we can make the leading section
          var newStartWord = thisModel.get("sections").models[0].get("startWord"),
              oldStartWord = thisModel.get("startWord");
          newStartWord.set("startChapter", true, {silent: true});
          // inform listeners that the word has changed from a section start to a chapter start
          newStartWord.trigger("sectionToChapter", newStartWord);
          oldStartWord.trigger("change:switchStartWord", oldStartWord, newStartWord);
        }
      });

      // listen for play events from the underlying chapter
      thisView.listenTo(thisView.model, "startVideo", function (stTime) {
        var $vid = thisView.$el.find("video"),
            vid = $vid[0];
        try {
          playOneVideo(vid, stTime);
        } catch (e) {
          $vid.one("canplay", function () {
            playOneVideo(vid, stTime);
          });
        }
      });
    },

    /**
     * return the {selector: rendered element} object used in the superclass render function
     */
    getAssignedObject: function () {
      var thisView = this;

      // prep the subviews
      // prep the subviews TODO iterate over all chapters
      thisView.sectionsView = thisView.sectionsView || new CollectionView({model: thisView.model.get("sections")});
      thisView.sectionsView.ComponentView = SectionView;

      // now add the digest and transcript view components to the editor template shell using the assign method
      var assignObj = {};
      assignObj["." + consts.sectionWrapClass] = thisView.sectionsView;

      return assignObj;
    }
  });
});
