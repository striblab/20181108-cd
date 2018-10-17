import 'intersection-observer';
import * as d3 from 'd3';
import * as topojson from "topojson";
import pct from '../sources/mnpct-small.json';
import mn from '../sources/mncd.json';
import mncounties from '../sources/counties.json';


class Map {

    constructor(target) {
        this.target = target;
        this.svg = d3.select(target + ' svg')
            .attr('width', $(target).outerWidth())
            .attr('height', $(target).outerHeight());
        this.g = this.svg.append('g');
        this.zoomed = false;
        this.scaled = $(target).width() / 520;
        this.colorScale = d3.scaleOrdinal()
            .domain(['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'r1', 'r2', 'r3', 'r4'])
            .range(['#83bc6d', '#82bae0', '#9d6cb2', '#3b7062', '#999999', '#7f98aa', '#eb6868', '#d6d066', '#F2D2A4', '#ed61a7']);
        this.colorScale2 = d3.scaleOrdinal()
            .domain(['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'r1', 'r2', 'r3', 'r4'])
            .range(['#83bc6d', '#82bae0', '#9d6cb2', '#3b7062', '#999999', '#7f98aa', '#eb6868', '#d6d066', '#F2D2A4', '#ed61a7']);
        // this.colorScale2 = d3.scaleOrdinal()
        //     .domain(['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'r1', 'r2', 'r3'])
        //     .range(['#43710f', '#3b6e91', '#50156a', '#255a51', '#322a56', '#333333', '#a31616', '#7a7406', '#ae4c04']);
    }

    /********** PRIVATE METHODS **********/

    // Detect if the viewport is mobile or desktop, can be tweaked if necessary for anything in between
    _detect_mobile() {
        var winsize = $(window).width();

        if (winsize < 600) {
            return true;
        } else {
            return false;
        }
    }

    _clickmn(district) {
        var self = this;

        //D3 CLICKY MAP BINDINGS
        jQuery.fn.d3Click = function() {
            this.each(function(i, e) {
                var evt = document.createEvent('MouseEvents');
                evt.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

                e.dispatchEvent(evt);
                return false;
            });
        };

        jQuery.fn.d3Down = function() {
            this.each(function(i, e) {
                var evt = document.createEvent('MouseEvents');
                evt.initMouseEvent('mousedown', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

                e.dispatchEvent(evt);
                return false;
            });
        };

        jQuery.fn.d3Up = function() {
            this.each(function(i, e) {
                var evt = document.createEvent('MouseEvents');
                evt.initMouseEvent('mouseup', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

                e.dispatchEvent(evt);
                return false;
            });
        };

        // Your mouse clicks are actually three events, which are simulated here to auto-zoom the map on a given id of a map path object
        $(self.target + " [id='" + district + "']").d3Down();
        $(self.target + " [id='" + district + "']").d3Up();
        $(self.target + " [id='" + district + "']").d3Click();

    }

    _populate_colors(filtered, magnify, party, geo, race, data) {

        var self = this;

        var index = Number(filtered);

        if (filtered != "all") {
            $(self.target + " .district").addClass("faded");
            $(self.target + " .county").addClass("hidden");
            $(self.target + " ." + filtered).removeClass("faded");
            $(self.target + " .CD1, " + self.target + " .CD2, " + self.target + " .CD3, " + self.target + ".CD4, " + self.target + " .CD5, " + self.target + " .CD6, " + self.target + " .CD7, " + self.target + " .CD8").addClass("infocus");
            $(self.target + " .district").removeClass("hidden");
            $(self.target + "#P" + race).addClass("hidden");
        } else {
            $(self.target + " .CD1, " + self.target + " .CD2, " + self.target + " .CD3, " + self.target + ".CD4, " + self.target + " .CD5, " + self.target + " .CD6, " + self.target + " .CD7, " + self.target + " .CD8").removeClass("infocus");
            $(self.target + " .CD1, " + self.target + " .CD2, " + self.target + " .CD3, " + self.target + ".CD4, " + self.target + " .CD5, " + self.target + " .CD6, " + self.target + " .CD7, " + self.target + " .CD8").removeClass("hidden");
            $(self.target + " .district").addClass("hidden");
            // $(".county").addClass("hidden");
        }

        var tooltip = function(accessor) {
            return function(selection) {
                var tooltipDiv;
                var bodyNode = d3.select('body').node();
                selection.on("mouseover", function(d, i) {
                        // Clean up lost tooltips
                        d3.select('body').selectAll('div.tooltip').remove();
                        // Append tooltip
                        tooltipDiv = d3.select('body').append('div').attr('class', 'tooltip');
                        var absoluteMousePos = d3.mouse(bodyNode);
                        tooltipDiv.style('left', (absoluteMousePos[0] + 10) + 'px')
                            .style('top', (absoluteMousePos[1] - 15) + 'px')
                            .style('position', 'absolute')
                            .style('z-index', 1001);
                        // Add text using the accessor function
                        var tooltipText = accessor(d, i) || '';
                        // Crop text arbitrarily
                        //tooltipDiv.style('width', function(d, i){return (tooltipText.length > 80) ? '300px' : null;})
                        //    .html(tooltipText);
                    })
                    .on('mousemove', function(d, i) {
                        // Move tooltip
                        var absoluteMousePos = d3.mouse(bodyNode);
                        tooltipDiv.style('left', (absoluteMousePos[0] + 10) + 'px')
                            .style('top', (absoluteMousePos[1] - 15) + 'px');
                        var tooltipText = accessor(d, i) || '';
                        tooltipDiv.html(tooltipText);
                        $("#tip").html(tooltipText);
                        if (self._detect_mobile() == true) {
                            $("#tip").show();
                            $(".key").hide();
                        }
                    })
                    .on("mouseout", function(d, i) {
                        // Remove tooltip
                        tooltipDiv.remove();
                        $("#tip").hide();
                        $(".key").show();
                        $("#tip").html("");
                    });

            };
        };

        this.g.selectAll(self.target + ' .precincts path')
            // .call(d3.helper.tooltip(function(d, i) {
            //     var candidates = [];
            //     var votes = 0;
            //     for (var i = 0; i < data.length; i++) {
            //         if (data[i].match == (d.properties.COUNTYCODE + d.properties.CONGDIST + d.properties.MNLEGDIST + d.properties.PCTCODE)) {
            //             if (party == 'DFL') {
            //                 candidates.push([data[i].d1_name, data[i].d1, self.colorScale('d1')]);
            //                 candidates.push([data[i].d2_name, data[i].d2, self.colorScale('d2')]);
            //                 if (data[0].d3_name != null && data[0].d3_name != "null")  {candidates.push([data[i].d3_name, data[i].d3, self.colorScale('d3')]); }
            //                 if (data[0].d4_name != null && data[0].d4_name != "null")  {candidates.push([data[i].d4_name, data[i].d4, self.colorScale('d4')]); }
            //                 if (data[0].d5_name != null && data[0].d5_name != "null")  {candidates.push([data[i].d5_name, data[i].d5, self.colorScale('d5')]); }
            //                 if (data[0].d6_name != null && data[0].d6_name != "null") { candidates.push([data[i].d6_name, data[i].d6, self.colorScale('d6')]); }
            //                 votes = data[i].dVotes;
            //             } else if (party == 'GOP') {
            //                 candidates.push([data[i].r1_name, data[i].r1, self.colorScale('r1')]);
            //                 candidates.push([data[i].r2_name, data[i].r2, self.colorScale('r2')]);
            //                 if (data[0].r3_name != null && data[0].r3_name != "null") { candidates.push([data[i].r3_name, data[i].r3, self.colorScale('r3')]); }
            //                 votes = data[i].rVotes;
            //             }

            //             function sortCandidates(a, b) {
            //                 if (a[1] === b[1]) {
            //                     return 0;
            //                 } else {
            //                     return (a[1] > b[1]) ? -1 : 1;
            //                 }
            //             }

            //             candidates.sort(sortCandidates);

            //             var tipString = "";

            //             for (var j=0; j < candidates.length; j++){
            //                 tipString = tipString + "<div class='tipRow'><div class='canName'>" + candidates[j][0] + "</div><div class='legendary votepct' style='background-color:" + candidates[j][2] + "'>" + d3.format(".1f")(candidates[j][1]) + "%</div></div>";
            //             }
            //             if (candidates[0][0] == 0) { return d.properties.PCTNAME + "<div>No results</div>"; } 
            //             else { return d.properties.PCTNAME + " " + tipString + "<div class='votes'>Votes: " + d3.format(",")(votes) + "</div>"; }
            //         }
            //     }
            //     return d.properties.PCTNAME + "<div>No results</div>";
            // }))
            .transition()
            .duration(600)
            .style('fill', function(d) {
                var winner = '';
                var winner_sat = '';
                var margin = '';
                var candidates;
                var count = 0;

                for (var i = 0; i < data.length; i++) {
                    if (data[i].match == (d.properties.COUNTYCODE + d.properties.CONGDIST + d.properties.MNLEGDIST + d.properties.PCTCODE)) {
                        if (party == 'DFL') {
                            winner_sat = self.colorScale2(data[i].dWin);
                            winner = self.colorScale(data[i].dWin);
                            margin = data[i].dMargin;
                            candidates = [data[i].d1, data[i].d2, data[i].d3, data[i].d4, data[i].d5, data[i].d6];
                        } else if (party == 'GOP') {
                            winner_sat = self.colorScale2(data[i].rWin);
                            winner = self.colorScale(data[i].rWin);
                            margin = data[i].rMargin;
                            candidates = [data[i].r1, data[i].r2, data[i].r3, data[i].r4];
                        }
                        for (var k = 0; k < candidates.length; k++) {
                            if (candidates[k] == margin) {
                                count++;
                            }
                        }
                        var colorIntensity = d3.scaleLinear().domain([1, 100]).range([winner, winner_sat]);
                        if (margin != 0 && count < 2) {
                            return colorIntensity(margin);
                        } else {
                            return '#eeeeee';
                        }
                    }
                }
                return '#eeeeee';
            });

        if (race == "1") {
            self._clickmn("P1");
            $(".reset").hide();
        } else if (race == "2") {
            self._clickmn("P2");
            $(".reset").hide();
        } else if (race == "3") {
            self._clickmn("P3");
            $(".reset").hide();
        } else if (race == "8") {
            self._clickmn("P8");
            $(".reset").hide();
        }

    }

    /********** PUBLIC METHODS **********/

    // Render the map
    render(filtered, magnify, party, geo, race, data) {
        var self = this;

        var projection = d3.geoAlbers().scale(5037).translate([50, 970]);

        var width = 520;
        var height = 600;
        var centered;

        var path = d3.geoPath(projection);

        var states = topojson.feature(pct, pct.objects.convert);
        var state = states.features.filter(function(d) {
            return d.properties.CONGDIST == filtered;
        })[0];

        var b = path.bounds(state),
            s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
            t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

        var cachedWidth = window.innerWidth;
        d3.select(window).on('resize', function() {
            var newWidth = window.innerWidth;
            if (newWidth !== cachedWidth) {
                cachedWidth = newWidth;
            }
        });

        //Draw precincts
        self.g.append('g')
            .attr('class', 'precincts')
            .selectAll('path')
            .data((topojson.feature(pct, pct.objects.convert).features).filter(function(d) {
                if (filtered != "all") {
                    return d.properties.CONGDIST == race;
                } else {
                    return d.properties.CONGDIST != 'blarg';
                }
            }))
            .enter().append('path')
            .attr('d', path)
            .attr('class', function(d) {
                return 'precinct CD' + d.properties.CONGDIST;
            })
            .attr('id', function(d) {
                return 'P' + d.properties.VTDID;
            })
            .style('stroke-width', '0.3px')
            .style('fill', '#dddddd')
            .on('mouseover', function(d) {

            })
        // .on('click', function(d) {
        //     if (race != "5") {
        //         clicked(d, 12);
        //     }
        // });

        var features = (topojson.feature(pct, pct.objects.convert).features).filter(function(d) {
            if (filtered != "all") {
                return d.properties.CONGDIST == race;
            }
        });

        var centroids = features.map(function(feature) {
            return path.centroid(feature);
        });

        //draw circles
        // self.g.selectAll(".centroid").data(centroids)
        //   .enter().append("circle")
        //     .attr("class", "marker")
        //     .attr("fill", "#000000")
        //     .attr("stroke", "#000000")
        //     .attr("stroke-width", "1px")
        //     .attr("r", function (d){ 
        //         if (geo == "metro") { }
        //         else { return 1; }
        //     })
        //     .attr("cx", function (d){ return d[0]; })
        //     .attr("cy", function (d){ return d[1]; });

        //draw shift lines
        self.g.selectAll(".centroid").data(centroids)
            .enter().append("line")
            .attr("stroke",
                function(d, i) {
                    if (features[i].properties.COUNTYCODE == "1" || features[i].properties.COUNTYCODE == "3") {
                        return "#7f98aa";
                    } else {
                        return "#8c0808";
                    }
                })
            .attr("stroke-width", "1px")
            .attr("class", "shifter")
            .attr("x1", function(d) {
                return d[0];
            })
            .attr("y1", function(d) {
                return d[1];
            })
            .attr("x2", function(d, i) {
                if (features[i].properties.COUNTYCODE == "1" || features[i].properties.COUNTYCODE == "3") {
                    return d[0] - 10;
                } else {
                    return d[0] + 10;
                }
            })
            .attr("y2", function(d) {
                return d[1];
            })

        //Draw congressional district borders
        self.g.append('g')
            .attr('class', 'districts')
            .selectAll('path')
            .data(topojson.feature(mn, mn.objects.mncd).features)
            .enter().append('path')
            .attr('d', path)
            .attr('class', function(d) {
                return 'district CD' + d.properties.DISTRICT;
            })
            .attr('id', function(d) {
                return 'P' + d.properties.DISTRICT;
            })
            .style('stroke-width', '1px')
            .on('mousedown', function(d) {})
            .on('click', function(d) {
                if (d.properties.DISTRICT == "5") {
                    clicked(d, 23);
                    $(self.target + " .CD1, " + self.target + " .CD2, " + self.target + " .CD3, " + self.target + ".CD4, " + self.target + " .CD5, " + self.target + " .CD6, " + self.target + " .CD7, " + self.target + " .CD8").addClass("infocus");
                    $("#P" + d.properties.DISTRICT).addClass("hidden");
                } else {
                    if (race == "1") {
                        clicked(d, 1.5);
                    } else if (race == "2") {
                        clicked(d, 4.1);
                    } else if (race == "3") {
                        clicked(d, 9);
                    } else if (race == "8") {
                        clicked(d, 1.2);
                    }
                }
            });


        //Draw county borders
        self.g.append('g')
            .attr('class', 'counties')
            .selectAll('path')
            .data(topojson.feature(mncounties, mncounties.objects.counties).features)
            .enter().append('path')
            .attr("class", "county")
            .attr('d', path)
            .attr('fill', 'none')
            .attr('stroke-width', '1px');


        function clicked(d, k) {
            var x, y, stroke;

            // if (d && centered !== d) {
            var centroid = path.centroid(d);
            x = centroid[0];
            y = centroid[1];
            centered = d;
            stroke = 0.2;
            $(self.target + ' .reset').show();
            // } 
            // else {
            //   x = width / 2;
            //   y = height / 2;
            //   k = 1;
            //   centered = null;
            //   stroke = 1.5;
            //   $(self.target + ' .reset').hide();
            // }

            $(".city-label").addClass("hidden");
            $(".mark").addClass("hidden");

            self.g.transition()
                .duration(300)
                .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')')
                .style('stroke-width', '0.2px');


            // $('.reset').on('click touch', function(event) {
            //     x = width / 2;
            //     y = height / 2;
            //     k = 1;
            //     centered = null;
            //     $(this).hide();
            //     stroke = 1.5;
            //     $("#tip").hide();
            //     $(".key").show();
            //     // self.g.selectAll('path')
            //     //     .classed('active', centered && function(d) { return d === centered; });
            //     self.g.transition()
            //         .duration(300)
            //         .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')')
            //         .style('stroke-width', stroke / k + 'px');
            //     event.stopPropagation();

            //     setTimeout(function() {
            //         // $(".CD1, .CD2, .CD3, .CD4, .CD5, .CD6, .CD7, .CD8").removeClass("infocus");
            //         // $(".district").removeClass("hidden");
            //         $(".city-label").removeClass("hidden");
            //         $(".mark").removeClass("hidden");
            //     }, 400);
            // });

        }


        var aspect = 520 / 600,
            chart = $(self.target + ' svg');
        var targetWidth = chart.parent().width();
        chart.attr('width', targetWidth);
        chart.attr('height', targetWidth / aspect);
        if ($(window).width() <= 520) {
            $(self.target + ' svg').attr('viewBox', '0 0 500 600');
        }

        $(window).on('resize', function() {
            targetWidth = chart.parent().width();
            chart.attr('width', targetWidth);
            chart.attr('height', targetWidth / aspect);
        });

        //COLOR THE MAP WITH LOADED DATA
        self._populate_colors(filtered, magnify, party, geo, race, data);
    }
}

export {
    Map as
    default
}