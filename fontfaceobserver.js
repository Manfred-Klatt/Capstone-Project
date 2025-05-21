// FontFaceObserver v2.0.14 - © Bram Stein. License: BSD-3-Clause
(function() {
    'use strict';

    var FontFaceObserver = function(family) {
        this.family = family;
        this.style = 'normal';
        this.weight = 'normal';
        this.stretch = 'normal';
        this.variationSettings = '';
        this.featureSettings = '';
        this.unicodeRange = '';
    };

    FontFaceObserver.prototype.with = function(options) {
        for (var key in options) {
            this[key] = options[key];
        }
        return this;
    };

    FontFaceObserver.prototype.check = function() {
        return new Promise(function(resolve) {
            var font = new FontFace(
                this.family,
                'url(' + this.family + ')',
                {
                    style: this.style,
                    weight: this.weight,
                    stretch: this.stretch,
                    variationSettings: this.variationSettings,
                    featureSettings: this.featureSettings,
                    unicodeRange: this.unicodeRange
                }
            );

            font.load().then(function() {
                resolve(true);
            }, function() {
                resolve(false);
            });
        }.bind(this));
    };

    window.FontFaceObserver = FontFaceObserver;
})();
