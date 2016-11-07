/**
 * jQuery Bracket
 *
 * Copyright (c) 2011-2016, Teijo Laine,
 * http://aropupu.fi/bracket/
 *
 * Licenced under the MIT licence
 */
/// <reference path="../lib/jquery.d.ts" />
(function ($) {
    var Option = (function () {
        function Option(val) {
            this.val = val;
            if (this.val === undefined) {
                throw new Error('Option cannot contain undefined');
            }
        }
        Option.of = function (value) {
            return new Option(value);
        };
        Option.prototype.get = function () {
            if (this.val === null) {
                throw new Error('Trying to get() empty Option');
            }
            return this.val;
        };
        Option.prototype.orElse = function (defaultValue) {
            return (this.val === null) ? defaultValue : this.val;
        };
        Option.prototype.orElseGet = function (defaultProvider) {
            return (this.val === null) ? defaultProvider() : this.val;
        };
        Option.prototype.map = function (f) {
            return (this.val === null) ? this : new Option(f(this.val));
        };
        Option.prototype.toNull = function () {
            return (this.val === null) ? null : this.val;
        };
        Option.prototype.isEmpty = function () {
            return this.val === null;
        };
        return Option;
    }());
    var BranchType;
    (function (BranchType) {
        BranchType[BranchType["TBD"] = 0] = "TBD";
        BranchType[BranchType["BYE"] = 1] = "BYE";
    })(BranchType || (BranchType = {}));
    var TeamBlock = (function () {
        function TeamBlock(source, // Where base of the information propagated from
            name, id, // Order in which team is in a match, 0 or 1
            idx, score) {
            this.source = source;
            this.name = name;
            this.id = id;
            this.idx = idx;
            this.score = score;
        }
        // Recursively check if branch ends into a BYE
        TeamBlock.prototype.emptyBranch = function () {
            if (!this.name.isEmpty()) {
                return BranchType.TBD;
            }
            else {
                try {
                    return this.source().emptyBranch();
                }
                catch (e) {
                    if (e instanceof EndOfBranchException) {
                        return BranchType.BYE;
                    }
                    else {
                        throw new Error('Unexpected exception type');
                    }
                }
            }
        };
        return TeamBlock;
    }());
    // http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
    function EndOfBranchException() {
        this.message = 'Root of information for this team';
        this.name = 'EndOfBranchException';
    }
    var MatchResult = (function () {
        function MatchResult(a, b) {
            this.a = a;
            this.b = b;
            return;
        }
        MatchResult.teamsInResultOrder = function (match) {
            var aBye = match.a.name.isEmpty();
            var bBye = match.b.name.isEmpty();
            if (bBye && !aBye) {
                if (match.b.emptyBranch() === BranchType.BYE) {
                    return [match.a, match.b];
                }
                else {
                    return [];
                }
            }
            else if (aBye && !bBye) {
                if (match.a.emptyBranch() === BranchType.BYE) {
                    return [match.b, match.a];
                }
                else {
                    return [];
                }
            }
            else if (isNumber(match.a.score) && isNumber(match.b.score)) {
                if (match.a.score > match.b.score) {
                    return [match.a, match.b];
                }
                else if (match.a.score < match.b.score) {
                    return [match.b, match.a];
                }
            }
            return [];
        };
        // Arbitrary (either parent) source is required so that branch emptiness
        // can be determined by traversing to the beginning.
        MatchResult.emptyTeam = function (source) {
            return new TeamBlock(source, Option.of(null), -1, -1, null);
        };
        MatchResult.prototype.winner = function () {
            return MatchResult.teamsInResultOrder(this)[0] || MatchResult.emptyTeam(this.a.source);
        };
        MatchResult.prototype.loser = function () {
            return MatchResult.teamsInResultOrder(this)[1] || MatchResult.emptyTeam(this.a.source);
        };
        return MatchResult;
    }());
    function depth(a) {
        function df(a, d) {
            if (a instanceof Array) {
                return df(a[0], d + 1);
            }
            return d;
        }
        return df(a, 0);
    }
    function wrap(a, d) {
        if (d > 0) {
            a = wrap([a], d - 1);
        }
        return a;
    }
    function trackHighlighter(teamIndex, cssClass, container) {
        var elements = container.find('.team[data-teamid=' + teamIndex + ']');
        var addedClass = !cssClass ? 'highlight' : cssClass;
        return {
            highlight: function () {
                elements.each(function () {
                    $(this).addClass(addedClass);
                    if ($(this).hasClass('win')) {
                        $(this).parent().find('.connector').addClass(addedClass);
                    }
                });
            },
            deHighlight: function () {
                elements.each(function () {
                    $(this).removeClass(addedClass);
                    $(this).parent().find('.connector').removeClass(addedClass);
                });
            }
        };
    }
    function postProcess(container, w, f) {
        var source = f || w;
        var winner = source.winner();
        var loser = source.loser();
        if (winner && loser) {
            if (!winner.name.isEmpty()) {
                trackHighlighter(winner.idx, 'highlightWinner', container).highlight();
            }
            if (!loser.name.isEmpty()) {
                trackHighlighter(loser.idx, 'highlightLoser', container).highlight();
            }
        }
        container.find('.team').mouseover(function () {
            var i = parseInt($(this).attr('data-teamid'), 10);
            // Don't highlight BYEs
            if (i === -1) {
                return;
            }
            var track = trackHighlighter(i, null, container);
            track.highlight();
            $(this).mouseout(function () {
                track.deHighlight();
                $(this).unbind('mouseout');
            });
        });
    }
    function defaultEdit(span, data, done) {
        var input = $('<input type="text">');
        input.val(data);
        span.empty().append(input);
        input.focus();
        input.blur(function () {
            done(input.val());
        });
        input.keydown(function (e) {
            var key = (e.keyCode || e.which);
            if (key === 9 /*tab*/ || key === 13 /*return*/ || key === 27 /*esc*/) {
                e.preventDefault();
                done(input.val(), (key !== 27));
            }
        });
    }
    function defaultRender(container, team, score) {
        container.append(team);
    }
    function winnerBubbles(match) {
        var el = match.el;
        var winner = el.find('.team.win');
        winner.append('<div class="bubble">1st</div>');
        var loser = el.find('.team.lose');
        loser.append('<div class="bubble">2nd</div>');
        return true;
    }
    function consolationBubbles(match) {
        var el = match.el;
        var winner = el.find('.team.win');
        winner.append('<div class="bubble third">3rd</div>');
        var loser = el.find('.team.lose');
        loser.append('<div class="bubble fourth">4th</div>');
        return true;
    }
    var winnerMatchSources = function (teams, m) { return function () { return [
        { source: function () { return new TeamBlock(function () { throw new EndOfBranchException(); }, teams[m][0], 0, (m * 2), null); } },
        { source: function () { return new TeamBlock(function () { throw new EndOfBranchException(); }, teams[m][1], 1, (m * 2 + 1), null); } }
    ]; }; };
    var winnerAlignment = function (match, skipConsolationRound) { return function (tC) {
        tC.css('top', '');
        tC.css('position', 'absolute');
        if (skipConsolationRound) {
            tC.css('top', (match.el.height() / 2 - tC.height() / 2) + 'px');
        }
        else {
            tC.css('bottom', (-tC.height() / 2) + 'px');
        }
    }; };
    function prepareWinners(winners, teams, isSingleElimination, opts, skipGrandFinalComeback) {
        var roundCount = Math.log(teams.length * 2) / Math.log(2);
        var matchCount = teams.length;
        var round;
        for (var r = 0; r < roundCount; r += 1) {
            round = winners.addRound();
            for (var m = 0; m < matchCount; m += 1) {
                var teamCb = (r === 0) ? winnerMatchSources(teams, m) : null;
                if (!(r === roundCount - 1 && isSingleElimination) && !(r === roundCount - 1 && skipGrandFinalComeback)) {
                    round.addMatch(teamCb);
                }
                else {
                    var match = round.addMatch(teamCb, winnerBubbles);
                    if (!skipGrandFinalComeback) {
                        match.setAlignCb(winnerAlignment(match, opts.skipConsolationRound));
                    }
                }
            }
            matchCount /= 2;
        }
        if (isSingleElimination) {
            winners.final().connectorCb(function () {
                return null;
            });
            if (teams.length > 1 && !opts.skipConsolationRound) {
                var prev = winners.final().round().prev();
                var third_1 = prev.map(function (p) { return p.match(0).loser; }).toNull();
                var fourth_1 = prev.map(function (p) { return p.match(1).loser; }).toNull();
                var consol_1 = round.addMatch(function () {
                    return [
                        { source: third_1 },
                        { source: fourth_1 }
                    ];
                }, consolationBubbles);
                consol_1.setAlignCb(function (tC) {
                    var height = (winners.el.height()) / 2;
                    consol_1.el.css('height', (height) + 'px');
                    var topShift = tC.height() / 2 + opts.matchMargin;
                    tC.css('top', (topShift) + 'px');
                });
                consol_1.connectorCb(function () {
                    return null;
                });
            }
        }
    }
    var loserMatchSources = function (winners, losers, matchCount, m, n, r) { return function () {
        /* first round comes from winner bracket */
        if (n % 2 === 0 && r === 0) {
            return [
                { source: winners.round(0).match(m * 2).loser },
                { source: winners.round(0).match(m * 2 + 1).loser }
            ];
        }
        else {
            /* To maximize the time it takes for two teams to play against
             * eachother twice, WB losers are assigned in reverse order
             * every second round of LB */
            var winnerMatch = (r % 2 === 0) ? (matchCount - m - 1) : m;
            return [
                { source: losers.round(r * 2).match(m).winner },
                { source: winners.round(r + 1).match(winnerMatch).loser }
            ];
        }
    }; };
    var loserAlignment = function (teamCon, match) { return function () { return teamCon.css('top', (match.el.height() / 2 - teamCon.height() / 2) + 'px'); }; };
    function prepareLosers(winners, losers, teamCount, skipGrandFinalComeback) {
        var roundCount = Math.log(teamCount * 2) / Math.log(2) - 1;
        var matchCount = teamCount / 2;
        for (var r = 0; r < roundCount; r += 1) {
            /* if player cannot rise back to grand final, last round of loser
             * bracket will be player between two LB players, eliminating match
             * between last WB loser and current LB winner */
            var subRounds = (skipGrandFinalComeback && r === (roundCount - 1) ? 1 : 2);
            for (var n = 0; n < subRounds; n += 1) {
                var round = losers.addRound();
                for (var m = 0; m < matchCount; m += 1) {
                    var teamCb = (!(n % 2 === 0 && r !== 0)) ? loserMatchSources(winners, losers, matchCount, m, n, r) : null;
                    var isLastMatch = r === roundCount - 1 && skipGrandFinalComeback;
                    var match = round.addMatch(teamCb, isLastMatch ? consolationBubbles : null);
                    match.setAlignCb(loserAlignment(match.el.find('.teamContainer'), match));
                    if (isLastMatch) {
                        // Override default connector
                        match.connectorCb(function () {
                            return null;
                        });
                    }
                    else if (r < roundCount - 1 || n < 1) {
                        var cb = (n % 2 === 0) ? function (tC, match) {
                            // inside lower bracket
                            var connectorOffset = tC.height() / 4;
                            var height = 0;
                            var shift = 0;
                            if (match.winner().id === 0) {
                                shift = connectorOffset;
                            }
                            else if (match.winner().id === 1) {
                                height = -connectorOffset * 2;
                                shift = connectorOffset;
                            }
                            else {
                                shift = connectorOffset * 2;
                            }
                            return { height: height, shift: shift };
                        } : null;
                        match.connectorCb(cb);
                    }
                }
            }
            matchCount /= 2;
        }
    }
    function prepareFinals(finals, winners, losers, opts, topCon) {
        var round = finals.addRound();
        var match = round.addMatch(function () {
            return [
                { source: winners.winner },
                { source: losers.winner }
            ];
        }, function (match) {
            /* Track if container has been resized for final rematch */
            var _isResized = false;
            /* LB winner won first final match, need a new one */
            if (!opts.skipSecondaryFinal && (!match.winner().name.isEmpty() && match.winner().name === losers.winner().name)) {
                if (finals.size() === 2) {
                    return false;
                }
                /* This callback is ugly, would be nice to make more sensible solution */
                var round_1 = finals.addRound(function () {
                    var rematch = ((!match.winner().name.isEmpty() && match.winner().name === losers.winner().name));
                    if (_isResized === false) {
                        if (rematch) {
                            _isResized = true;
                            topCon.css('width', (parseInt(topCon.css('width'), 10) + (opts.teamWidth + opts.scoreWidth + opts.roundMargin)) + 'px');
                        }
                    }
                    if (!rematch && _isResized) {
                        _isResized = false;
                        finals.dropRound();
                        topCon.css('width', (parseInt(topCon.css('width'), 10) - (opts.teamWidth + opts.scoreWidth + opts.roundMargin)) + 'px');
                    }
                    return rematch;
                });
                /* keep order the same, WB winner top, LB winner below */
                var match2_1 = round_1.addMatch(function () {
                    return [
                        { source: match.first },
                        { source: match.second }
                    ];
                }, winnerBubbles);
                match.connectorCb(function (tC) {
                    return { height: 0, shift: tC.height() / 2 };
                });
                match2_1.connectorCb(function () {
                    return null;
                });
                match2_1.setAlignCb(function (tC) {
                    var height = (winners.el.height() + losers.el.height());
                    match2_1.el.css('height', (height) + 'px');
                    var topShift = (winners.el.height() / 2 + winners.el.height() + losers.el.height() / 2) / 2 - tC.height();
                    tC.css('top', (topShift) + 'px');
                });
                return false;
            }
            else {
                return winnerBubbles(match);
            }
        });
        match.setAlignCb(function (tC) {
            var height = (winners.el.height() + losers.el.height());
            if (!opts.skipConsolationRound) {
                height /= 2;
            }
            match.el.css('height', (height) + 'px');
            var topShift = (winners.el.height() / 2 + winners.el.height() + losers.el.height() / 2) / 2 - tC.height();
            tC.css('top', (topShift) + 'px');
        });
        if (!opts.skipConsolationRound) {
            var prev_1 = losers.final().round().prev();
            var consol_2 = round.addMatch(function () {
                return [
                    { source: prev_1.get().match(0).loser },
                    { source: losers.loser }
                ];
            }, consolationBubbles);
            consol_2.setAlignCb(function (tC) {
                var height = (winners.el.height() + losers.el.height()) / 2;
                consol_2.el.css('height', (height) + 'px');
                var topShift = (winners.el.height() / 2 + winners.el.height() + losers.el.height() / 2) / 2 + tC.height() / 2 - height;
                tC.css('top', (topShift) + 'px');
            });
            match.connectorCb(function () {
                return null;
            });
            consol_2.connectorCb(function () {
                return null;
            });
        }
        winners.final().connectorCb(function (tC) {
            var shift;
            var height;
            var connectorOffset = tC.height() / 4;
            var topShift = (winners.el.height() / 2 + winners.el.height() + losers.el.height() / 2) / 2 - tC.height() / 2;
            var matchupOffset = topShift - winners.el.height() / 2;
            if (winners.winner().id === 0) {
                height = matchupOffset + connectorOffset * 2;
                shift = connectorOffset;
            }
            else if (winners.winner().id === 1) {
                height = matchupOffset;
                shift = connectorOffset * 3;
            }
            else {
                height = matchupOffset + connectorOffset;
                shift = connectorOffset * 2;
            }
            height -= tC.height() / 2;
            return { height: height, shift: shift };
        });
        losers.final().connectorCb(function (tC) {
            var shift;
            var height;
            var connectorOffset = tC.height() / 4;
            var topShift = (winners.el.height() / 2 + winners.el.height() + losers.el.height() / 2) / 2 - tC.height() / 2;
            var matchupOffset = topShift - winners.el.height() / 2;
            if (losers.winner().id === 0) {
                height = matchupOffset;
                shift = connectorOffset * 3;
            }
            else if (losers.winner().id === 1) {
                height = matchupOffset + connectorOffset * 2;
                shift = connectorOffset;
            }
            else {
                height = matchupOffset + connectorOffset;
                shift = connectorOffset * 2;
            }
            height += tC.height() / 2;
            return { height: -height, shift: -shift };
        });
    }
    var Round = (function () {
        function Round(bracket, previousRound, roundIdx, 
            // TODO: results should be enforced to be correct by now
            _results, doRenderCb, mkMatch, isFirstBracket, opts) {
            this.bracket = bracket;
            this.previousRound = previousRound;
            this.roundIdx = roundIdx;
            this._results = _results;
            this.doRenderCb = doRenderCb;
            this.mkMatch = mkMatch;
            this.isFirstBracket = isFirstBracket;
            this.opts = opts;
            this.containerWidth = this.opts.teamWidth + this.opts.scoreWidth;
            this.roundCon = $("<div class=\"round\" style=\"width: " + this.containerWidth + "px; margin-right: " + this.opts.roundMargin + "px\"/>");
            this.matches = [];
        }
        Object.defineProperty(Round.prototype, "el", {
            get: function () {
                return this.roundCon;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Round.prototype, "id", {
            get: function () {
                return this.roundIdx;
            },
            enumerable: true,
            configurable: true
        });
        Round.prototype.addMatch = function (teamCb, renderCb) {
            var matchIdx = this.matches.length;
            var teams = (teamCb !== null) ? teamCb() : [
                { source: this.bracket.round(this.roundIdx - 1).match(matchIdx * 2).winner },
                { source: this.bracket.round(this.roundIdx - 1).match(matchIdx * 2 + 1).winner }
            ];
            var teamA = teams[0].source;
            var teamB = teams[1].source;
            var matchResult = new MatchResult(new TeamBlock(teamA, teamA().name, 0, teamA().idx, null), new TeamBlock(teamB, teamB().name, 1, teamB().idx, null));
            var match = this.mkMatch(this, matchResult, matchIdx, this._results.map(function (r) { return r[matchIdx] === undefined
                ? null
                : (r[matchIdx].length >= 2 /*may be empty array, e.g. initialized with 'results: []'*/
                    ? r[matchIdx]
                    : [null, null]); }), renderCb, this.isFirstBracket, this.opts);
            this.matches.push(match);
            return match;
        };
        Round.prototype.match = function (id) {
            return this.matches[id];
        };
        Round.prototype.prev = function () {
            return this.previousRound;
        };
        Round.prototype.size = function () {
            return this.matches.length;
        };
        Round.prototype.render = function () {
            this.roundCon.empty();
            if (typeof (this.doRenderCb) === 'function' && !this.doRenderCb()) {
                return;
            }
            this.roundCon.appendTo(this.bracket.el);
            this.matches.forEach(function (m) { return m.render(); });
        };
        Round.prototype.results = function () {
            return this.matches.reduce(function (agg, m) { return agg.concat([m.results()]); }, []);
        };
        return Round;
    }());
    function mkBracket(bracketCon, results, mkMatch, isFirstBracket, opts) {
        var rounds = [];
        return {
            el: bracketCon,
            addRound: function (doRenderCb) {
                var id = rounds.length;
                var previous = (id > 0) ? rounds[id - 1] : null;
                // Rounds may be undefined if init score array does not match number of teams
                var roundResults = results.map(function (r) { return (r[id] === undefined) ? null : r[id]; });
                var round = new Round(this, Option.of(previous), id, roundResults, doRenderCb, mkMatch, isFirstBracket, opts);
                rounds.push(round);
                return round;
            },
            dropRound: function () {
                rounds.pop();
            },
            round: function (id) {
                return rounds[id];
            },
            size: function () {
                return rounds.length;
            },
            final: function () {
                return rounds[rounds.length - 1].match(0);
            },
            winner: function () {
                return rounds[rounds.length - 1].match(0).winner();
            },
            loser: function () {
                return rounds[rounds.length - 1].match(0).loser();
            },
            render: function () {
                bracketCon.empty();
                /* Length of 'rounds' can increase during render in special case when
                 LB win in finals adds new final round in match render callback.
                 Therefore length must be read on each iteration. */
                for (var i = 0; i < rounds.length; i += 1) {
                    rounds[i].render();
                }
            },
            results: function () {
                return rounds.reduce(function (agg, r) { return agg.concat([r.results()]); }, []);
            }
        };
    }
    function connector(roundMargin, height, shift, teamCon, align) {
        var width = roundMargin / 2;
        var drop = true;
        // drop:
        // [team]'\
        //         \_[team]
        // !drop:
        //         /'[team]
        // [team]_/
        if (height < 0) {
            drop = false;
            height = -height;
        }
        /* straight lines are prettier */
        if (height < 2) {
            height = 0;
        }
        var src = $('<div class="connector"></div>').appendTo(teamCon);
        src.css('height', height);
        src.css('width', width + 'px');
        src.css(align, (-width - 2) + 'px');
        if (shift >= 0) {
            src.css('top', shift + 'px');
        }
        else {
            src.css('bottom', (-shift) + 'px');
        }
        if (drop) {
            src.css('border-bottom', 'none');
        }
        else {
            src.css('border-top', 'none');
        }
        var dst = $('<div class="connector"></div>').appendTo(src);
        dst.css('width', width + 'px');
        dst.css(align, -width + 'px');
        if (drop) {
            dst.css('bottom', '0px');
        }
        else {
            dst.css('top', '0px');
        }
        return src;
    }
    function countRounds(teamCount, isSingleElimination, skipGrandFinalComeback) {
        if (isSingleElimination) {
            return Math.log(teamCount * 2) / Math.log(2);
        }
        else if (skipGrandFinalComeback) {
            return Math.max(2, (Math.log(teamCount * 2) / Math.log(2) - 1) * 2 - 1); // DE - grand finals
        }
        else {
            return (Math.log(teamCount * 2) / Math.log(2) - 1) * 2 + 1; // DE + grand finals
        }
    }
    function exportData(data) {
        var output = $.extend(true, {}, data);
        output.teams = output.teams.map(function (ts) { return ts.map(function (t) { return t.toNull(); }); });
        return output;
    }
    var JqueryBracket = function (opts) {
        var align = opts.dir === 'lr' ? 'right' : 'left';
        var resultIdentifier;
        if (!opts) {
            throw Error('Options not set');
        }
        if (!opts.el) {
            throw Error('Invalid jQuery object as container');
        }
        if (!opts.init && !opts.save) {
            throw Error('No bracket data or save callback given');
        }
        if (opts.userData === undefined) {
            opts.userData = null;
        }
        if (opts.decorator && (!opts.decorator.edit || !opts.decorator.render)) {
            throw Error('Invalid decorator input');
        }
        else if (!opts.decorator) {
            opts.decorator = { edit: defaultEdit, render: defaultRender };
        }
        var data;
        if (!opts.init) {
            opts.init = {
                teams: [
                    [Option.of(null), Option.of(null)]
                ],
                results: []
            };
        }
        data = opts.init;
        var topCon = $('<div class="jQBracket ' + opts.dir + '"></div>').appendTo(opts.el.empty());
        var w, l, f;
        function renderAll(save) {
            resultIdentifier = 0;
            w.render();
            if (l) {
                l.render();
            }
            if (f && !opts.skipGrandFinalComeback) {
                f.render();
            }
            postProcess(topCon, w, f);
            if (save) {
                data.results[0] = w.results();
                if (l) {
                    data.results[1] = l.results();
                }
                if (f && !opts.skipGrandFinalComeback) {
                    data.results[2] = f.results();
                }
                if (opts.save) {
                    opts.save(exportData(data), opts.userData);
                }
            }
        }
        function getOnClick(rId) {
            var rmp = getRoundMatchPlayer(rId);
            return 'updateWinner('+rmp[0]+','+rmp[1]+','+rmp[2]+')';
        }
        function getRoundSizes() {
            var roundSizes = new Array();
            for(var i=0;i<data.results[0].length;i++) {
                roundSizes.push(data.results[0][i].length*2);
            }
            return roundSizes;
        }
        function getRound(roundSizes,rId) {
            var runningSum=0;
            for(var i=1;i<=roundSizes.length;i++) {
                runningSum+=roundSizes[i-1];
                if(rId < runningSum)
                    return i;
            }
            return i;
        }
        function getMatchPlayer(roundSizes,rId,round) {
            var runningSum = 0;
            for(var i=1;i<round;i++) {
                runningSum += roundSizes[i-1];
            }
            var offsetRId = rId-runningSum;
            var player = offsetRId%2 === 0?1:2;
            var match = (offsetRId-(player-1))/2+1;
            return [match,player];
        }
        function getRoundMatchPlayer(rId) {
            var roundSizes = getRoundSizes();
            var round = getRound(roundSizes,rId);
            var matchPlayer = getMatchPlayer(roundSizes,rId,round);

            return [round,matchPlayer[0],matchPlayer[1]];
        }
        function teamElement(round, match, team, opponent, isReady, isFirstBracket, opts) {
            var rId = resultIdentifier;
            var score = (team.name.isEmpty() || opponent.name.isEmpty() || !isReady)
                ? '--'
                : (team.score === null || !isNumber(team.score) ? '--' : team.score);
            var onclickString = getOnClick(rId);
            var bEl = $("<div class=\"score\" style=\"width: " + opts.scoreWidth + "px;\" data-resultid=\"result-' + rId + '\"></div>")
                .attr('onclick',onclickString).text('W');
            resultIdentifier += 1;
            var name = team.name.orElseGet(function () {
                var type = team.emptyBranch();
                if (type === BranchType.BYE) {
                    return 'BYE';
                }
                else if (type === BranchType.TBD) {
                    return 'TBD';
                }
                else {
                    throw new Error("Unexpected branch type " + type);
                }
            });
            var tEl = $("<div class=\"team\" style=\"width: " + (opts.teamWidth + opts.scoreWidth) + "px;\"></div>");
            var nEl = $("<div class=\"label\" style=\"width: " + opts.teamWidth + "px;\"></div>").appendTo(tEl);
            if (round === 0) {
                tEl.attr('data-resultid', 'team-' + rId);
            }
            opts.decorator.render(nEl, name, score);
            if (isNumber(team.idx)) {
                tEl.attr('data-teamid', team.idx);
            }
            if (team.name.isEmpty()) {
                tEl.addClass('na');
            }
            else if (match.winner().name === team.name) {
                tEl.addClass('win');
            }
            else if (match.loser().name === team.name) {
                tEl.addClass('lose');
            }
            tEl.append(bEl);
            // Only first round of BYEs can be edited
            if ((!team.name.isEmpty() || (team.name.isEmpty() && round === 0 && isFirstBracket)) && typeof (opts.save) === 'function') {
                if (!opts.disableTeamEdit) {
                    nEl.addClass('editable');
                    nEl.click(function () {
                        var span = $(this);
                        function editor() {
                            function done_fn(val, next) {
                                opts.init.teams[~~(team.idx / 2)][team.idx % 2] = Option.of(val || null);
                                renderAll(true);
                                span.click(editor);
                                var labels = opts.el.find('.team[data-teamid=' + (team.idx + 1) + '] div.label:first');
                                if (labels.length && next === true && round === 0) {
                                    $(labels).click();
                                }
                            }
                            span.unbind();
                            opts.decorator.edit(span, team.name.toNull(), done_fn);
                        }
                        editor();
                    });
                }
            }
            return tEl;
        }
        function mkMatch(round, match, idx, results, renderCb, isFirstBracket, opts) {
            var matchCon = $('<div class="match"></div>');
            var teamCon = $('<div class="teamContainer"></div>');
            var connectorCb = null;
            var alignCb = null;
            if (!opts.save) {
                var matchUserData_1 = results.map(function (r) { return r.length < 3 ? null : r[2]; }).toNull();
                if (opts.onMatchHover) {
                    teamCon.hover(function () {
                        opts.onMatchHover(matchUserData_1, true);
                    }, function () {
                        opts.onMatchHover(matchUserData_1, false);
                    });
                }
                if (opts.onMatchClick) {
                    teamCon.click(function () { opts.onMatchClick(matchUserData_1); });
                }
            }
            match.a.name = match.a.source().name;
            match.b.name = match.b.source().name;
            match.a.score = results.map(function (r) { return r[0]; }).toNull();
            match.b.score = results.map(function (r) { return r[1]; }).toNull();
            /* match has score even though teams haven't yet been decided */
            /* todo: would be nice to have in preload check, maybe too much work */
            if ((!match.a.name || !match.b.name) && (isNumber(match.a.score) || isNumber(match.b.score))) {
                console.log('ERROR IN SCORE DATA: ' + match.a.source().name + ': ' +
                    match.a.score + ', ' + match.b.source().name + ': ' + match.b.score);
                match.a.score = match.b.score = null;
            }
            return {
                el: matchCon,
                id: idx,
                round: function () {
                    return round;
                },
                connectorCb: function (cb) {
                    connectorCb = cb;
                },
                connect: function (cb) {
                    var connectorOffset = teamCon.height() / 4;
                    var matchupOffset = matchCon.height() / 2;
                    var shift;
                    var height;
                    if (!cb || cb === null) {
                        if (idx % 2 === 0) {
                            if (this.winner().id === 0) {
                                shift = connectorOffset;
                                height = matchupOffset;
                            }
                            else if (this.winner().id === 1) {
                                shift = connectorOffset * 3;
                                height = matchupOffset - connectorOffset * 2;
                            }
                            else {
                                shift = connectorOffset * 2;
                                height = matchupOffset - connectorOffset;
                            }
                        }
                        else {
                            if (this.winner().id === 0) {
                                shift = -connectorOffset * 3;
                                height = -matchupOffset + connectorOffset * 2;
                            }
                            else if (this.winner().id === 1) {
                                shift = -connectorOffset;
                                height = -matchupOffset;
                            }
                            else {
                                shift = -connectorOffset * 2;
                                height = -matchupOffset + connectorOffset;
                            }
                        }
                    }
                    else {
                        var info = cb(teamCon, this);
                        if (info === null) {
                            return;
                        }
                        shift = info.shift;
                        height = info.height;
                    }
                    teamCon.append(connector(opts.roundMargin, height, shift, teamCon, align));
                },
                winner: function () { return match.winner(); },
                loser: function () { return match.loser(); },
                first: function () {
                    return match.a;
                },
                second: function () {
                    return match.b;
                },
                setAlignCb: function (cb) {
                    alignCb = cb;
                },
                render: function () {
                    matchCon.empty();
                    teamCon.empty();
                    // This shouldn't be done at render-time
                    match.a.name = match.a.source().name;
                    match.b.name = match.b.source().name;
                    match.a.idx = match.a.source().idx;
                    match.b.idx = match.b.source().idx;
                    var isDoubleBye = match.a.name.isEmpty() && match.b.name.isEmpty();
                    if (isDoubleBye) {
                        teamCon.addClass('np');
                    }
                    else if (!match.winner().name) {
                        teamCon.addClass('np');
                    }
                    else {
                        teamCon.removeClass('np');
                    }
                    // Coerce truthy/falsy "isset()" for Typescript
                    var isReady = !match.a.name.isEmpty() && !match.b.name.isEmpty();
                    teamCon.append(teamElement(round.id, match, match.a, match.b, isReady, isFirstBracket, opts));
                    teamCon.append(teamElement(round.id, match, match.b, match.a, isReady, isFirstBracket, opts));
                    matchCon.appendTo(round.el);
                    matchCon.append(teamCon);
                    this.el.css('height', (round.bracket.el.height() / round.size()) + 'px');
                    teamCon.css('top', (this.el.height() / 2 - teamCon.height() / 2) + 'px');
                    /* todo: move to class */
                    if (alignCb !== null) {
                        alignCb(teamCon);
                    }
                    var isLast = (typeof (renderCb) === 'function') ? renderCb(this) : false;
                    if (!isLast) {
                        this.connect(connectorCb);
                    }
                },
                results: function () {
                    // Either team is bye -> reset (mutate) scores from that match
                    var hasBye = match.a.name.isEmpty() || match.b.name.isEmpty();
                    if (hasBye) {
                        match.a.score = match.b.score = null;
                    }
                    return [match.a.score, match.b.score];
                }
            };
        }
        function getSeatingIndex(i) {
            var index=[1,5,3,7,2,6,4,8];
            return index[i]-1;
        }
        function makeSeating(seatingCont, teams) {
            var playerArray = new Array();
            for(var i=0;i<teams.length;i++) {
                for(var j=0;j<teams[i].length;j++) {
                    var index = 2*i+j;
                    playerArray[getSeatingIndex(index)] = teams[i][j].val;
                }
            }
            var nEl;
            for(var seat=0;seat < 4;seat++) {
                nEl = $("<div class=\"seat\" style=\"width: " + opts.teamWidth + "px;\"></div>").appendTo(seatingCont);
                opts.decorator.render(nEl, playerArray[seat], null);
            }
            var tableElement = $('<div class=\"seatingTable\"></div>');
            tableElement.appendTo(seatingCont);
            for(seat=7;seat >= 4;seat--) {
                nEl = $("<div class=\"seat\" style=\"width: " + opts.teamWidth + "px;\"></div>").appendTo(seatingCont);
                opts.decorator.render(nEl, playerArray[seat], null);
            }
        }
        /* wrap data to into necessary arrays */
        var r = wrap(data.results, 4 - depth(data.results));
        data.results = r;
        var isSingleElimination = (r.length <= 1);
        if (opts.skipSecondaryFinal && isSingleElimination) {
            $.error('skipSecondaryFinal setting is viable only in double elimination mode');
        }
        if (!opts.disableToolbar) {
            embedEditButtons(topCon, data, opts);
        }
        var fEl, wEl, lEl, sEl;
        if (isSingleElimination) {
            wEl = $('<div class="bracket"></div>').appendTo(topCon);
        }
        else {
            if (!opts.skipGrandFinalComeback) {
                fEl = $('<div class="finals"></div>').appendTo(topCon);
            }
            wEl = $('<div class="bracket"></div>').appendTo(topCon);
            lEl = $('<div class="loserBracket"></div>').appendTo(topCon);
        }
        // 45 === team height x2 + 1px margin
        var height = data.teams.length * 45 + data.teams.length * opts.matchMargin;
        wEl.css('height', height);
        // reserve space for consolation round
        if (isSingleElimination && data.teams.length <= 2 && !opts.skipConsolationRound) {
            topCon.css('height', height + 40);
        }
        if (lEl) {
            lEl.css('height', wEl.height() / 2);
        }
        var roundCount = countRounds(data.teams.length, isSingleElimination, opts.skipGrandFinalComeback);
        if (!opts.disableToolbar) {
            topCon.css('width', roundCount * (opts.teamWidth + opts.scoreWidth + opts.roundMargin) + 40);
        }
        else {
            topCon.css('width', roundCount * (opts.teamWidth + opts.scoreWidth + opts.roundMargin) + 10);
        }
        w = mkBracket(wEl, Option.of(r[0] || null), mkMatch, true, opts);
        if (!isSingleElimination) {
            l = mkBracket(lEl, Option.of(r[1] || null), mkMatch, false, opts);
            if (!opts.skipGrandFinalComeback) {
                f = mkBracket(fEl, Option.of(r[2] || null), mkMatch, false, opts);
            }
        }
        prepareWinners(w, data.teams, isSingleElimination, opts, opts.skipGrandFinalComeback && !isSingleElimination);
        if (!isSingleElimination) {
            prepareLosers(w, l, data.teams.length, opts.skipGrandFinalComeback);
            if (!opts.skipGrandFinalComeback) {
                prepareFinals(f, w, l, opts, topCon);
            }
        }
        if(opts.showSeating) {
            sEl = $('<div class="seating"></div>').appendTo(topCon);
            makeSeating(sEl,data.teams);
        }
        renderAll(false);
        return {
            data: function () {
                return exportData(opts.init);
            }
        };
    };
    function embedEditButtons(topCon, data, opts) {
        var tools = $('<div class="tools"></div>').appendTo(topCon);
        var inc = $('<span class="increment">+</span>').appendTo(tools);
        inc.click(function () {
            var len = data.teams.length;
            for (var i = 0; i < len; i += 1) {
                data.teams.push([Option.of(null), Option.of(null)]);
            }
            return JqueryBracket(opts);
        });
        if (data.teams.length > 1 && data.results.length === 1 ||
            data.teams.length > 2 && data.results.length === 3) {
            var dec = $('<span class="decrement">-</span>').appendTo(tools);
            dec.click(function () {
                if (data.teams.length > 1) {
                    data.teams = data.teams.slice(0, data.teams.length / 2);
                    return JqueryBracket(opts);
                }
            });
        }
        if (data.results.length === 1 && data.teams.length > 1) {
            var type = $('<span class="doubleElimination">de</span>').appendTo(tools);
            type.click(function () {
                if (data.teams.length > 1 && data.results.length < 3) {
                    data.results.push([], []);
                    return JqueryBracket(opts);
                }
            });
        }
        else if (data.results.length === 3 && data.teams.length > 1) {
            var type = $('<span class="singleElimination">se</span>').appendTo(tools);
            type.click(function () {
                if (data.results.length === 3) {
                    data.results = data.results.slice(0, 1);
                    return JqueryBracket(opts);
                }
            });
        }
    }
    var assertNumber = function (opts, field) {
        if (opts.hasOwnProperty(field)) {
            var expectedType = 'number';
            var type = typeof (opts[field]);
            if (type !== expectedType) {
                throw new Error("Option \"" + field + "\" is " + type + " instead of " + expectedType);
            }
        }
    };
    var assertGt = function (expected, opts, field) {
        var value = opts[field];
        if (value < expected) {
            throw new Error("Value of " + field + " must be greater than " + expected + ", got " + value);
        }
    };
    var isPow2 = function (x) { return (x & (x - 1)); };
    var methods = {
        init: function (originalOpts) {
            var opts = $.extend(true, {}, originalOpts); // Do not mutate inputs
            var that = this;
            opts.el = this;
            if (opts.save && (opts.onMatchClick || opts.onMatchHover)) {
                $.error('Match callbacks may not be passed in edit mode (in conjunction with save callback)');
            }
            var disableToolbarType = typeof (opts.disableToolbar);
            var disableToolbarGiven = opts.hasOwnProperty('disableToolbar');
            if (disableToolbarGiven && disableToolbarType !== 'boolean') {
                $.error("disableToolbar must be a boolean, got " + disableToolbarType);
            }
            if (!opts.save && disableToolbarGiven) {
                $.error('disableToolbar can be used only if the bracket is editable, i.e. "save" callback given');
            }
            if (!disableToolbarGiven) {
                opts.disableToolbar = (opts.save === undefined);
            }
            var disableTeamEditType = typeof (opts.disableTeamEdit);
            var disableTeamEditGiven = opts.hasOwnProperty('disableTeamEdit');
            if (disableTeamEditGiven && disableTeamEditType !== 'boolean') {
                $.error("disableTeamEdit must be a boolean, got " + disableTeamEditType);
            }
            if (!opts.save && disableTeamEditGiven) {
                $.error('disableTeamEdit can be used only if the bracket is editable, i.e. "save" callback given');
            }
            if (!disableTeamEditGiven) {
                opts.disableTeamEdit = false;
            }
            if (!opts.disableToolbar && opts.disableTeamEdit) {
                $.error('disableTeamEdit requires also resizing to be disabled, initialize with "disableToolbar: true"');
            }
            assertNumber(opts, 'teamWidth');
            assertNumber(opts, 'scoreWidth');
            assertNumber(opts, 'roundMargin');
            assertNumber(opts, 'matchMargin');
            if (!opts.hasOwnProperty('teamWidth')) {
                opts.teamWidth = 70;
            }
            if (!opts.hasOwnProperty('scoreWidth')) {
                opts.scoreWidth = 30;
            }
            if (!opts.hasOwnProperty('roundMargin')) {
                opts.roundMargin = 40;
            }
            if (!opts.hasOwnProperty('matchMargin')) {
                opts.matchMargin = 20;
            }
            assertGt(0, opts, 'teamWidth');
            assertGt(0, opts, 'scoreWidth');
            assertGt(0, opts, 'roundMargin');
            assertGt(0, opts, 'matchMargin');
            var log2Result = isPow2(opts.init.teams.length);
            if (log2Result !== Math.floor(log2Result)) {
                $.error("\"teams\" property must have 2^n number of team pairs, i.e. 1, 2, 4, etc. Got " + opts.init.teams.length + " team pairs.");
            }
            opts.dir = opts.dir || 'lr';
            opts.init.teams = !opts.init.teams || opts.init.teams.length === 0 ? [[null, null]] : opts.init.teams;
            opts.init.teams = opts.init.teams.map(function (ts) { return ts.map(function (t) { return Option.of(t); }); });
            opts.skipConsolationRound = opts.skipConsolationRound || false;
            opts.skipSecondaryFinal = opts.skipSecondaryFinal || false;
            if (opts.dir !== 'lr' && opts.dir !== 'rl') {
                $.error('Direction must be either: "lr" or "rl"');
            }
            var bracket = JqueryBracket(opts);
            $(this).data('bracket', { target: that, obj: bracket });
            return bracket;
        },
        data: function () {
            var bracket = $(this).data('bracket');
            return bracket.obj.data();
        }
    };
    $.fn.bracket = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        }
        else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        }
        else {
            $.error('Method ' + method + ' does not exist on jQuery.bracket');
        }
    };
})(jQuery);
