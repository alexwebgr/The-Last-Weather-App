/*
 * Copyright (c) 2013 Marco van Hylckama Vlieg
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

$(function ($)
{
    setLanguage();
    //getWeather();

    $("#language").on({
        change : function ()
        {
            //phrases = null;
            var lang = $("#language").val();
            console.log(lang);
            //$(document).unbind();
            localStorage.setItem("language", lang);
            setLanguage();
            try
            {
                blackberry.ui.cover.resetCover();
            }
            catch (e)
            {
                console.log(e);
            }
        }
    },"option");


    $("#language").find("option").each(function ()
    {
        var lang = getLanguage();

        if (lang == $(this).val())
        {
            $(this).attr("selected", "true");
        }
    });

    $("body").on({
        click : function()
        {
            $("#weather, #bbmscreen").hide();
            $("#infoscreen").show();
            //$("#menu").removeClass("on");
            //$("#menu").hide();
        }
    },"#menu");
});

    function getLanguage()
    {
        var lang = localStorage.getItem("language");

        if (!lang)
        {
            lang = "en";
            localStorage.setItem("language", lang);
            //js/strings-" + lang + ".js"
        }

        return lang;
    }

    function setLanguage()
    {
        var lang = getLanguage();

        localStorage.setItem("language", lang);

        $.ajax({
            url : "js/strings-" + lang + ".js",
            success : function (data)
            {
                //eval(data);
                $("body")
                    .removeClass("night")
                    .html("<div id='weather' />")
                ;

                getWeather();
            }
        });
    }

    function getWeather()
    {

        $("#weather").html("<div id='loader'><p id='fetching'>" + phrases.fetching + "</p></div>");
        navigator.geolocation.getCurrentPosition(showWeather);

        function showWeather(position)
        {
            var night = false;
            var avg_temp = null;
            var lat = Math.round(position.coords.latitude * 10000) / 10000;
            var lon = Math.round(position.coords.longitude * 10000) / 10000;
            night = isNight(lat, lon);

            $.getJSON("http://api.openweathermap.org/data/2.1/find/city?lat=" + lat + "&lon=" + lon + "&cnt=1&APPID=02ba45d924a74a0b3c381dcfd7d57061",function (data)
            {
                var out;
                var dot = "";
                var tempnote = null;
                var tempicon;
                var weather = "";
                var d = new Date();
                var weathericonstrip = "";
                var weatheritems = 0;
                var hours = d.getHours();
                var minutes = d.getMinutes();
                var seconds = d.getSeconds();
                var bbmmessage = phrases.myweather + ": ";

                if (hours < 10)
                {
                    hours = "0" + hours;
                }
                if (minutes < 10)
                {
                    minutes = "0" + minutes;
                }
                if (seconds < 10)
                {
                    seconds = "0" + seconds;
                }
                if (data.list[0].weather)
                {
                    for (var i = 0; i < data.list[0].weather.length; i++)
                    {
                        if (i == data.list[0].weather.length - 1)
                        {
                            dot = ".";
                        }
                        if (weatheritems > 0)
                        {
                            // right now this only works on English. On other languages nothing will happen
                            weather += "<div class='weatherdescription'> " + phrases.and + " " + weatherCodes[data.list[0].weather[i].id].replace(/fucking/, "bloody") + dot + "</div>";
                            bbmmessage = bbmmessage + " and " + weatherCodes[data.list[0].weather[i].id].replace(/fucking/, "bloody") + dot;
                        }
                        else
                        {
                            weatheritems++;
                            weather += "<div class='weatherdescription'>" + weatherCodes[data.list[0].weather[i].id].charAt(0).toUpperCase() + weatherCodes[data.list[0].weather[i].id].slice(1) + dot + "</div>";
                            bbmmessage = bbmmessage + weatherCodes[data.list[0].weather[i].id].charAt(0).toUpperCase() + weatherCodes[data.list[0].weather[i].id].slice(1) + dot;
                        }
                        for (var k = 0; k < weatherIcons[data.list[0].weather[i].id].length; k++)
                        {
                            if (!weathericonstrip.match(weatherIcons[data.list[0].weather[i].id][k]))
                            {
                                weathericonstrip += "<img src='img/" + weatherIcons[data.list[0].weather[i].id][k] + "' />";
                            }
                        }
                    }
                    // strip the HTML for the BBM status message
                    bbmmessage = bbmmessage.replace(/<(?:.|\n)*?>/gm, "");
                    var path = null;
                    if (night)
                    {
                        weathericonstrip = weathericonstrip.replace(/day/g, "night");
                        path = "local:///img/c_" + weatherIcons[data.list[0].weather[0].id][0].replace(/day/g, "night").replace(".png", "_n.png");
                    }
                    else
                    {
                        path = "local:///img/c_" + weatherIcons[data.list[0].weather[0].id][0];
                    }

                    try
                    {
                        blackberry.ui.cover.setContent(blackberry.ui.cover.TYPE_IMAGE, {
                            path : path
                        });

                        // set Active Cover
                        blackberry.ui.cover.labels.push({
                            label : "(" + Math.round((avg_temp * 1.8) + 32) + "F / " + Math.round(avg_temp) + "C)",
                            size : 10,
                            wrap : true
                        });
                        blackberry.ui.cover.labels.push({
                            label : bbmmessage.replace(phrases.myweather + ": ", ""),
                            size : 10,
                            wrap : true
                        });
                        function onEnterCover()
                        {
                            blackberry.ui.cover.updateCover();
                        }

                        blackberry.event.addEventListener("entercover", onEnterCover);
                    }
                    catch (e)
                    {
                        console.log(e);
                    }

                    // Choose which temperature icon and message to show
                    avg_temp = ((data.list[0].main.temp_max + data.list[0].main.temp_min) / 2) - 273.15;
                    if (avg_temp < -15)
                    {
                        tempnote = temperatures[0];
                        bbmmessage = bbmmessage + " " + temperatures[0];
                        tempicon = "<img src='img/temp_0.png' />";
                    }
                    if (avg_temp > -15 && avg_temp <= -5)
                    {
                        tempnote = temperatures[1];
                        bbmmessage = bbmmessage + " " + temperatures[1];
                        tempicon = "<img src='img/temp_1.png' />";
                    }
                    if (avg_temp > -5 && avg_temp <= 5)
                    {
                        tempnote = temperatures[2];
                        bbmmessage = bbmmessage + " " + temperatures[2];
                        tempicon = "<img src='img/temp_2.png' />";
                    }
                    if (avg_temp > 5 && avg_temp <= 18)
                    {
                        tempnote = temperatures[3];
                        bbmmessage = bbmmessage + " " + temperatures[3];
                        tempicon = "<img src='img/temp_3.png' />";
                    }
                    if (avg_temp > 18 && avg_temp <= 25)
                    {
                        tempnote = temperatures[4];
                        bbmmessage = bbmmessage + " " + temperatures[4];
                        tempicon = "<img src='img/temp_4.png' />";
                    }
                    if (avg_temp > 25 && avg_temp <= 35)
                    {
                        tempnote = temperatures[5];
                        bbmmessage = bbmmessage + " " + temperatures[5];
                        tempicon = "<img src='img/temp_5.png' />";
                    }
                    if (avg_temp > 35)
                    {
                        tempnote = temperatures[6];
                        bbmmessage = bbmmessage + " " + temperatures[6];
                        tempicon = "<img src='img/temp_5.png' />";
                    }
                }

                bbmmessage = bbmmessage + " " + "(" + Math.round((avg_temp * 1.8) + 32) + "F / " + Math.round(avg_temp) + "C)";
                out = "<div class='weatherIcons'>" + weathericonstrip + "</div>";
                out = out + "<div id='weatherpanel'>";
                out = out + "<p id='loc'>" + phrases.near + " " + data.list[0].name + ".</p>";
                out = out + "<p id='myweather'>" + phrases.rightnow + " (" + hours + ":" + minutes + ") :</p>";
                out = out + "<div class='weathertext'>" + weather + "</div>";
                out = out + "<div class='temp'>" + tempicon + "<div class='temptext'>" + tempnote + " <span class='temperature'> (" + Math.round((avg_temp * 1.8) + 32) + "&deg;F / " + Math.round(avg_temp) + "&deg;C)</span></div></div>";
                if (night)
                {
                    out = out + "<div class='footnote'>" + phrases.outsidenight + "</div>";
                }
                else
                {
                    out = out + "<div class='footnote'>" + phrases.outside + "</div>";
                }
                out = out + "<div class='poweredby'>" + phrases.attribution + "<br/>" + phrases.onlyon + " BlackBerry&reg; 10</div>";
                out = out + "</div>";
                out = out + "<div id='menu'><div id='bbm'></div><div id='share'></div><div id='refresh'></div><div id='info'></div></div>";
                if (night)
                {
                    out = out.replace(/\.png/g, "_n.png");
                }
                if (night)
                {
                    $("body").addClass("night");
                }
                else
                {
                    $("body").removeClass("night");
                }
                var weatherDiv = $("#weather");

                weatherDiv.html(out);

                $("#loc, #bbm, #info, #share, #refresh").hide();

                /*
                 html2canvas(weatherDiv,
                 {
                 // first, create a canvas version of the weather screen
                 onrendered: function(canvas)
                 {
                 // second, save the canvas as an image
                 saveCanvas(canvas);
                 if(night)
                 {
                 $(".footnote").html(phrases.yououtsidenight);
                 }
                 else
                 {
                 $(".footnote").html(phrases.yououtside);
                 }
                 $("#loc, #bbm, #info, #share, #refresh").show();
                 $(".poweredby, #myweather").remove();
                 }
                 });
                 */
            weatherDiv.after("<div id='infoscreen'><h1>" + phrases.appname + "</h1><p>" + phrases.bymarco + "</p><p>" + phrases.copyright + "</p><p>" + phrases.idea + "</p><p>" + phrases.poweredby + " <strong>openweathermap.org</strong></p><div id='lang'><select id='language'><option value='en'>English</option><option value='gb'>British English</option><option value='es'>Espa&ntilde;ol</option><option value='it'>Italiano</option><option value='nl'>Nederlands</option></select></div><div id='applink'>" + phrases.screamager + " <img src='img/scrmicon.png'></div><div id='returnbtn'>&raquo; " + phrases.return + "</div></div><div id='bbmscreen'><h2>BBM</h2><ul><li id='bbmupdate'>&raquo; " + phrases.setpersonal + "</li><li id='bbmdownload'>&raquo; " + phrases.invite + "</li><li id='return'>&raquo; " + phrases.return + "</li></ul></div>");
            $("#infoscreen, #bbmscreen").hide();
            $("#returnbtn, #bbmscreen li, #applink")
                .bind("touchstart", function (e)
                {
                    e.target.style.background = "#cccccc";
                })
                .bind("touchend", function (e)
                {
                    e.target.style.background = "transparent";
                });
/*
            $(document)
                .bind("touchend", function (e)
                {
                    // handler for all possible UI interactions
                    var request;
                    console.log(e.target.id);
                    switch (e.target.id)
                    {
                        case "menu":
                            //$("#menu").toggleClass("on");
                            break;
                        case "info":
                            $("#weather, #bbmscreen").hide();
                            $("#infoscreen").show();
                            $("#menu").removeClass("on");
                            $("#menu").hide();
                            break;
                        case "returnbtn":
                            $("#weather").show();
                            $("#infoscreen, #bbmscreen").hide();
                            $("#menu").show();
                            break;
                        case "refresh":
                            $(document).unbind();
                            $("body").removeClass("night");
                            blackberry.ui.cover.resetCover();
                            $("body").html("<div id="weather"></div>");
                            getWeather();
                            break;
                        case "bbm":
                            $("#weather, #infoscreen").hide();
                            $("#bbmscreen").show();
                            $("#menu").removeClass("on");
                            $("#menu").hide();
                            break;
                        case "share":
                            // use invoke framework to share the previously created image of the user"s current weather situation
                            $("#menu").removeClass("on");
                            request = {
                                action : "bb.action.SHARE",
                                uri : "file://" + blackberry.io.sharedFolder + "/documents/tlwa.png",
                                target_type : ["CARD"]
                            };
                            blackberry.invoke.card.invokeTargetPicker(request, phrases.sharemisery,
                                // success
                                function ()
                                {
                                },
                                // error
                                function (e)
                                {
                                    console.log(e);
                                });
                            break;
                        case "return":
                            $("#weather").show();
                            $("#infoscreen, #bbmscreen").hide();
                            $("#menu").show();
                            break;
                        case "bbmupdate":
                            if (bbm.registered)
                            {
                                bbm.save(bbmmessage);
                            }
                            break;
                        case "bbmdownload":
                            if (bbm.registered)
                            {
                                bbm.inviteToDownload();
                            }
                            break;
                        case "applink":
                            appWorld();
                            break;
                        default:
                            $("#menu").removeClass("on");
                            break;
                    }
                });
*/
        }).error(function ()
            {
                var out = "<div class='weathertext'>" + phrases.errorfetching + "</div><div class='footnote'>" + phrases.lookoutsideafterall + "</div>";
                $("#weather").html(out);
            });
    }
}

function appWorld()
{

    // fire up appWorld with a predefined app. In this case it"s Screamager
    blackberry.invoke.invoke({
        uri : "http://appworld.blackberry.com/webstore/content/22052928"
    }, onInvokeSuccess, onInvokeError);
}

function onInvokeSuccess()
{
    console.log("Invocation successful.");
}

function onInvokeError(error)
{
    console.log("Invocation failed, error: " + error);
}

