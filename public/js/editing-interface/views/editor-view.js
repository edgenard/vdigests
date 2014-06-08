
/*global define */
define(["backbone", "underscore", "jquery", "text!templates/editing-template.html", "editing-interface/views/compound-view", "editing-interface/views/digest-view",
        "editing-interface/views/transcript-view", "editing-interface/models/chapter-model", "editing-interface/models/section-model"], function (Backbone, _, $, tmpl, CompoundBackboneView, DigestView, TranscriptView, ChapterModel, SectionModel) {

          var consts = {
            digestWrapClass: "digest-wrap",
            transWrapClass: "transcript-wrap",
            viewClass: "editor-wrap",
            RETURN_KEY_CODE: 13,
            ESCAPE_KEYCODE: 27,
            F1_KEYCODE: 112,
            F2_KEY_CODE:113,
            SPACE_KEYCODE: 32
          };

          return CompoundBackboneView.extend({
            template: _.template(tmpl),
            className: consts.viewClass,
            events: {
              "keydown": function (evt) {
                if (evt.keyCode === consts.RETURN_KEY_CODE) {
                  // enter should always blur
                  evt.target.blur();
                  evt.stopPropagation();
                  evt.preventDefault();
                }
              },
              "click #preview-vdigest": "previewVDigest"
            },

            initialize: function () {
              var thisView = this;

              $(document.body).on("keyup", function (evt) {
                if (evt.keyCode === consts.ESCAPE_KEYCODE) {
                  var wasPlaying = false;
                  $("video").each(function (i, vid) {
                    if (!vid.paused) {
                      wasPlaying = true;
                      vid.pause();
                    }
                  });
                  if (!wasPlaying) {
                    if (window.prevPlayVid) {
                      window.prevPlayVid.play();
                      evt.stopPropagation();
                    } else {
                      var thevid = $("video")[0];
                      thevid && thevid.play();
                    }
                  }
                } else if (evt.keyCode === consts.F1_KEYCODE) {
                  var blob = new window.Blob([window.JSON.stringify(thisView.model.getOutputJSON())], {type: "text/plain;charset=utf-8"});
                  window.saveAs(blob, "video-digest.json");
                } else if (evt.keyCode === consts.F2_KEY_CODE) {
                  $('input[type=file]').one("change", function() {
                    thisView.handleUpload(this);
                    console.log("input file change");
                  });
                  $('input[type=file]').trigger('click');
                }
              });
            },

            /**
             * Add the custom scrollbar after the rendering
             */
            postRender: function () {
              var thisView = this;
              // FIXME jScrollPane needs to be called after DOM insertion?
              window.setTimeout(function () {
                var el = thisView.$el.find("." + consts.transWrapClass).jScrollPane({autoReinitialise: true, autoReinitialiseDelay: 2000});
                // TODO bad globals
                window.jspApi = el.data("jsp");
              }, 100);
            },

            /**
             * return the {selector: rendered element} object used in the superclass render function
             */
            getAssignedObject: function () {
              var thisView = this;

              // prep the subviews
              thisView.digestView = thisView.digestView || new DigestView({model: thisView.model.get("digest")});
              thisView.transView = thisView.transView || new TranscriptView({model: thisView.model.get("transcript")});

              // now add the digest and transcript view components to the editor template shell using the assign method
              var assignObj = {};
              assignObj["." + consts.digestWrapClass] = thisView.digestView;
              assignObj["." + consts.transWrapClass] = thisView.transView;

              return assignObj;
            },

            /**
             * Handle uploading vdigest data
             */
            handleUpload: function (uploadEl) {
              var thisView = this;

              if (window.File && window.FileReader && window.FileList && window.Blob) {
                var uploadFile = uploadEl.files[0];
                var filereader = new window.FileReader();

                filereader.onload = function(){
                  var txtRes = filereader.result;
                  var jsonObj = JSON.parse(txtRes);
                  thisView.model.useJSONData(jsonObj);
                  window.setTimeout(function () {
                    $("." + consts.digestWrapClass).scrollTop(0);
                  }, 500);
                };
                filereader.readAsText(uploadFile);
              } else {
                alert("Your browser won't let you upload a file...");
              }
            },

            /**
             * Transition to vdigest preview
             */
            previewVDigest: function () {
              var locSplit = window.location.hash.split("/");
              window.location.hash = "view/" + locSplit.slice(1).join("/");
            }
          });
        });