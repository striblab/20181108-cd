import 'intersection-observer';
import * as d3 from 'd3';
import * as topojson from "topojson";
import pct from '../sources/mnpct-shifts.json';
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
        this.red2red = d3.scaleLinear()
            .domain([0,0.5])
            .range(['#db655e', '#8C1B17']);
            this.red2blue = d3.scaleLinear()
            .domain([0,0.5])
            .range(['#db655e', '#dd3497']);
        this.blue2blue = d3.scaleLinear()
            .domain([0,0.5])
            .range(['#ABCEE8', '#4f97c4']);
        this.blue2red = d3.scaleLinear()
            .domain([0,0.5])
            .range(['#ABCEE8', '#413374']);
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
            .call(tooltip(function(d, i) {

                var shifter;
                var can1;
                var can2;

                if (d.properties.shifts_r_pct16 > d.properties.shifts_d_pct16) {
                    can1 = "<div class='legendary r4'>GOP: " + d3.format(".1%")(d.properties.shifts_r_pct16) + "</div>";
                    can2 = "<div class='legendary d4'>DFL: " + d3.format(".1%")(d.properties.shifts_d_pct16) + "</div>";
                } else {
                    can2 = "<div class='legendary r4'>GOP: " + d3.format(".1%")(d.properties.shifts_r_pct16) + "</div>";
                    can1 = "<div class='legendary d4'>DFL: " + d3.format(".1%")(d.properties.shifts_d_pct16) + "</div>";
                }

                if (d.properties.shifts_shift == "D") {
                    shifter = "⇦ " + d.properties.shifts_shift + "+" + d3.format(".1%")(d.properties.shifts_shift_pct);
                } else {
                    shifter = d.properties.shifts_shift + "+" + d3.format(".1%")(d.properties.shifts_shift_pct) + " ⇨";
                }

                return d.properties.PCTNAME + can1 + can2 + "<div>" + shifter + "</div>";

                //return d.properties.PCTNAME + "<div>No results</div>";
            }))
            .transition()
            .duration(600)
            .style('fill', function(d) {
                return "#ededed";

                // if (d.properties.shifts_win16 == "D") { 
                //     return '#A7E6E3'; 
                //     if (d.properties.shifts_shift == "D") {
                //         return self.blue2blue(d.properties.shifts_shift_pct);
                //     }
                //     else if (d.properties.shifts_shift == "R") {
                //         return self.blue2red(d.properties.shifts_shift_pct);
                //     }
                    
                // }
                // else if (d.properties.shifts_win16 == "R") { 
                //     return '#F2AC93';
                //     if (d.properties.shifts_shift == "D") {
                //         return self.red2blue(d.properties.shifts_shift_pct);
                //     }
                //     else if (d.properties.shifts_shift == "R") {
                //         return self.red2red(d.properties.shifts_shift_pct);
                //     }
                     
                // }
                // else { 
                //     return '#eeeeee'; 
                // }
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

        var projection = d3.geoMercator().scale(5037).translate([50, 970]);

        var width = 520;
        var height = 0;

        if (race == "1") {
            height = 350;
        } else if (race == "2") {
            height = 400;
        }  else if (race == "3") {
            height = 400;
        }  else if (race == "8") {
            height = 400;
        } 

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
                        clicked(d, 1);
                    } else if (race == "2") {
                        clicked(d, 2.8);
                    } else if (race == "3") {
                        clicked(d, 6.5);
                    } else if (race == "8") {
                        clicked(d, 0.84);
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
            //     .attr("fill", function(d, i) {
            //         if (features[i].properties.shifts_shift == "D") {
            //             // if (features[i].properties.shifts_shift_pct < 0.05) { return "#D1E6E1"; }
            //             // else if (features[i].properties.shifts_shift_pct < 0.1) { return "#67B4C2"; }
            //             // else if (features[i].properties.shifts_shift_pct < 0.2) { return "#3580A3"; }
            //             return "#7f98aa";
            //         } else {
            //             // if (features[i].properties.shifts_shift_pct < 0.05) { return "#F2AC93"; }
            //             // else if (features[i].properties.shifts_shift_pct < 0.1) { return "#F2614C"; }
            //             // else if (features[i].properties.shifts_shift_pct < 0.2) { return "#C22A22"; }
            //             return "#8c0808";
            //         }
            //     })
            //     .attr("stroke", function(d, i) {
            //         if (features[i].properties.shifts_shift == "D") {
            //             return "#7f98aa";
            //         } else {
            //             return "#8c0808";
            //         }
            //     })
            //     .attr("stroke-width", "0")
            //     .attr("r", function(d) {
            //         if (race == "2") { return 0.4; }
            //         else if (race == "3")  { return 0.2; }
            //         else { return 0.7; }
            //     })
            //     .attr("cx", function (d, i){ 
            //         var divider = 7;
            //         if (race == "2") { divider = 2; }
            //         else if (race == "3") { divider = 1; }

            //         if (features[i].properties.shifts_shift == "D") {
            //             return d[0] - divider;
            //             // return d[0] - ((100 * features[i].properties.shifts_shift_pct) / divider);
            //         } else {
            //             return d[0] + divider;
            //         }
            //      })
            //     .attr("cy", function (d, i){ 
            //         var divider = 3;
            //         if (race == "2") { divider = 2; }
            //         else if (race == "3") { divider = 1; }

            //         return (d[1] - divider);
            //     });
    
            //draw shift lines
            self.g.selectAll(".centroid").data(centroids)
                .enter().append("line")
                .attr("stroke", function(d, i) {
                    if (features[i].properties.shifts_shift == "D") {
                        // if (features[i].properties.shifts_shift_pct < 0.05) { return "#D1E6E1"; }
                        // else if (features[i].properties.shifts_shift_pct < 0.1) { return "#67B4C2"; }
                        // else if (features[i].properties.shifts_shift_pct < 0.2) { return "#3580A3"; }
                        return "#7f98aa";
                    } else {
                        // if (features[i].properties.shifts_shift_pct < 0.05) { return "#F2AC93"; }
                        // else if (features[i].properties.shifts_shift_pct < 0.1) { return "#F2614C"; }
                        // else if (features[i].properties.shifts_shift_pct < 0.2) { return "#C22A22"; }
                        return "#8c0808";
                    }
                    })
                .attr("stroke-width", function(d) {
                    if (race == "3"){ return "0.1px"; }
                    else if (race == "2") { return "0.2px"; }
                    else { return "0.5px"; }
                })
                .attr("class", "shifter")
                .attr("x1", function(d) {
                    return d[0];
                })
                .attr("y1", function(d) {
                    return d[1];
                })
                .attr("x2", function(d, i) {
                    var divider = 7;
                    if (race == "2") { divider = 2; }
                    else if (race == "3") { divider = 1; }

                    if (features[i].properties.shifts_shift == "D") {
                        return d[0] - divider;
                        // return d[0] - ((100 * features[i].properties.shifts_shift_pct) / divider);
                    } else {
                        return d[0] + divider;
                    }
                })
                .attr("y2", function(d, i) {
                    var divider = 3;
                    if (race == "2") { divider = 2; }
                    else if (race == "3") { divider = 1; }

                    return (d[1] - divider);

                    // return (d[1] - 5)  + ((100 * features[i].properties.shifts_shift_pct) / divider);
                })
                .attr("marker-end", function(d, i) {
                    if (features[i].properties.shifts_shift == "D") {
                        // if (features[i].properties.shifts_shift_pct < 0.05) { return "#D1E6E1"; }
                        // else if (features[i].properties.shifts_shift_pct < 0.1) { return "#67B4C2"; }
                        // else if (features[i].properties.shifts_shift_pct < 0.2) { return "#3580A3"; }
                        return "url(#arrowD)";
                    } else {
                        // if (features[i].properties.shifts_shift_pct < 0.05) { return "#F2AC93"; }
                        // else if (features[i].properties.shifts_shift_pct < 0.1) { return "#F2614C"; }
                        // else if (features[i].properties.shifts_shift_pct < 0.2) { return "#C22A22"; }
                        return "url(#arrowR)";
                    }
                    });

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