(function ($) {

    /*!
     * String Scoring Algorithm 0.1.21
     *
     * http://joshaven.com/string_score
     * https://github.com/joshaven/string_score
     *
     * Copyright (C) 2009-2014 Joshaven Potter <yourtech@gmail.com>
     * Special thanks to all of the contributors listed here https://github.com/joshaven/string_score
     * MIT License: http://opensource.org/licenses/MIT
     *
     * Date: Tue Mar 1 2011
     * Updated: Wed Jun 18 2014
    */
    String.prototype.score = function (word, fuzziness) {
        'use strict';

        // If the string is equal to the word, perfect match.
        if (this === word) { return 1; }

        //if it's not a perfect match and is empty return 0
        if (word === "") { return 0; }

        var runningScore = 0,
            charScore,
            finalScore,
            string = this,
            lString = string.toLowerCase(),
            strLength = string.length,
            lWord = word.toLowerCase(),
            wordLength = word.length,
            idxOf,
            startAt = 0,
            fuzzies = 1,
            fuzzyFactor,
            i;

        // Cache fuzzyFactor for speed increase
        if (fuzziness) fuzzyFactor = 1 - fuzziness;

        // Walk through word and add up scores.
        // Code duplication occurs to prevent checking fuzziness inside for loop
        if (fuzziness) {
            for (i = 0; i < wordLength; ++i) {

                // Find next first case-insensitive match of a character.
                idxOf = lString.indexOf(lWord[i], startAt);

                if (-1 === idxOf) {
                    fuzzies += fuzzyFactor;
                    continue;
                } else if (startAt === idxOf) {
                    // Consecutive letter & start-of-string Bonus
                    charScore = 0.7;
                } else {
                    charScore = 0.1;

                    // Acronym Bonus
                    // Weighing Logic: Typing the first character of an acronym is as if you
                    // preceded it with two perfect character matches.
                    if (string[idxOf - 1] === ' ') charScore += 0.8;
                }

                // Same case bonus.
                if (string[idxOf] === word[i]) charScore += 0.1;

                // Update scores and startAt position for next round of indexOf
                runningScore += charScore;
                startAt = idxOf + 1;
            }
        } else {
            for (i = 0; i < wordLength; ++i) {
                idxOf = lString.indexOf(lWord[i], startAt);
                if (-1 === idxOf) {
                    return 0;
                } else if (startAt === idxOf) {
                    charScore = 0.7;
                } else {
                    charScore = 0.1;
                    if (string[idxOf - 1] === ' ') charScore += 0.8;
                }
                if (string[idxOf] === word[i]) charScore += 0.1;
                runningScore += charScore;
                startAt = idxOf + 1;
            }
        }

        // Reduce penalty for longer strings.
        finalScore = 0.5 * (runningScore / strLength    + runningScore / wordLength) / fuzzies;

        if ((lWord[0] === lString[0]) && (finalScore < 0.85)) {
            finalScore += 0.15;
        }

        return finalScore;
    };

    $.anywhere = function (data, shortcuts, limitPerGroup, showGroupCount) {

        // default value for limitPerGroup setting
        limitPerGroup = limitPerGroup || 5;

        var plugin = this;
        plugin.data = [];
        plugin.lastSet = [];
        plugin.isActive = false;

        /**
         * Internal event handling system
         */
        plugin.events = {_events: {}};
        plugin.on = plugin.events.on = function (event, callback, context) {
            if (!_.has(this._events, event)) {
                this._events[event] = [];
            }
            this._events[event].push({callback: callback, context: context});
        };
        plugin.events.trigger = function (event) {
            var args = Array.prototype.slice.call(arguments, 1);
            if (_.has(this._events, event)) {
                var events = this._events[event];
                _.each(events, function (e) {
                    var cbk = _.bind(e["callback"], e["context"]);
                    cbk.apply(this, args);
                });
            }
        };
        plugin.events.off = function (event) {
            if (_.has(this._events, event)) {
                delete this._events[event];
            }
        };

        /**
         * Show search box
         */
        plugin.showSearchBox = function () {
            plugin.isActive = true;
            $(".sensei-anywhere").toggle();
            var $input = $(".sensei-anywhere input");
            $input.focus();
            plugin.updateResults($input.val().trim());
            plugin.events.trigger("show");
        };

        /**
         * Hide search box
         */
        plugin.hideSearchBox = function () {

            // hide search box itself
            $(".sensei-anywhere").hide();

            // clear search box
            $(".sensei-anywhere").find("input").val(null);

            plugin.isActive = false;
            plugin.events.trigger("close");
        };

        /**
         * Update search results
         * @param term
         */
        plugin.updateResults = function (term) {

            var head;
            var group_size = limitPerGroup;
            var $wrapper = $(".sensei-anywhere .sensei-anywhere-list");
            $wrapper.html("");

            _.each(plugin.data, function (group) {

                if (term) {

                    head = _.sortBy(_.filter(group.items, function (item) {
                        return item.score(term) > 0;
                    }), function (item) {
                        return item.score(term) * -1;
                    });

                } else {
                    head = group.items;
                }

                if (head.length > 0) {
                    var $li = $("<li>").addClass("item-group").text(group.group);
                    $wrapper.append($li);

                    if (showGroupCount) {
                        var $span = $("<span>").addClass("group-count").text(" " + head.length);
                        $li.append($span);
                    }

                    _.each(head.slice(0, group_size), function (item) {
                        $wrapper.append($("<li>").addClass("item").text(item).data("group", group.group));
                    });
                }

            });

            $(".sensei-anywhere .sensei-anywhere-list li.item:first").addClass("active");
        };

        /**
         * Move selection up
         */
        plugin.moveActiveItemUp = function () {
            var $curr = $(".sensei-anywhere .sensei-anywhere-list li.item.active");
            $curr.removeClass("active");
            if ($curr.prevAll("li.item").length > 0) {
                var $item = $curr.prevAll("li.item").first().addClass("active");
            } else {
                var $item = $(".sensei-anywhere .sensei-anywhere-list li.item:last").addClass("active");
            }
            plugin.events.trigger("highlight", $item.text());
        };

        /**
         * Move selection down
         */
        plugin.moveActiveItemDown = function () {
            var $curr = $(".sensei-anywhere .sensei-anywhere-list li.item.active");
            $curr.removeClass("active");
            if ($curr.nextAll("li.item").length > 0) {
                var $item = $curr.nextAll("li.item").first().addClass("active");
            } else {
                var $item = $(".sensei-anywhere .sensei-anywhere-list li.item:first").addClass("active");
            }
            plugin.events.trigger("highlight", $item.text());
        };

        /**
         * Choose active item
         */
        plugin.chooseItem = function () {
            var $item = $(".sensei-anywhere .sensei-anywhere-list li.item.active");
            var item = $item.text();
            plugin.hideSearchBox();
            plugin.events.trigger("select", item, $item.data());
        };

        /**
         * Initialize plugin
         * @param data
         * @param shortcuts
         * @returns {jQuery}
         */
        plugin.init = function (data, shortcuts) {

            // render html
            if ($(".sensei-anywhere").length === 0) {
                var $el = $("<div>").addClass("sensei-anywhere")
                    .append($("<input>").addClass("mousetrap"))
                    .append($("<ul>").addClass("sensei-anywhere-list"));
                $("body").append($el);
            }

            plugin.data = data;
            Mousetrap.bind(shortcuts, plugin.showSearchBox);
            Mousetrap.bind(["esc"], function (e) {
                if (plugin.isActive) {
                    e.preventDefault();
                    plugin.hideSearchBox();
                }
            });
            Mousetrap.bind(["up", "shift+tab"], function (e) {
                if (plugin.isActive) {
                    e.preventDefault();
                    plugin.moveActiveItemUp();
                }
            });
            Mousetrap.bind(["down", "tab"], function (e) {
                if (plugin.isActive) {
                    e.preventDefault();
                    plugin.moveActiveItemDown();
                }
            });
            Mousetrap.bind(["enter"], function (e) {
                if (plugin.isActive) {
                    e.preventDefault();
                    plugin.chooseItem();
                }
            });
            $(".sensei-anywhere input").on("keyup", function (e) {
                var usedKeyCodes = [9, 13, 38, 40];
                if (!_.contains(usedKeyCodes, e.which)) {
                    var term = $(this).val().trim();
                    plugin.updateResults(term);
                }
            });
            $(".sensei-anywhere .sensei-anywhere-list").on("click", "li.item", function (e) {
                e.preventDefault();
                $(this).addClass("active").siblings().removeClass("active");
                plugin.chooseItem();
            });
            plugin.events.trigger("init");
            return plugin;
        };

        /**
         * Set data
         * @param data
         */
        plugin.setData = function (data) {
            plugin.data = data;
        };

        return plugin.init(data, shortcuts);

    }

})(jQuery);
