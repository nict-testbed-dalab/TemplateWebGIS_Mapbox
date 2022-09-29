/******************************************************************************/
/* Copyright (c) NICT. All rights reserved.                                   */
/* See License.txt for the license information.                               */
/******************************************************************************/

/******************************************************************************/
/* getZoomLevel                                                               */
/******************************************************************************/
function getZoomLevel()
{

  var objOptions = $("#timeline").k2goTimeline("getOptions");
  var intSize    = objOptions.endTime.getTime() - objOptions.startTime.getTime();

  if ($Env.zoomTable[0] <= intSize)
  {
    return 0;
  }
  else if ($Env.zoomTable[$Env.zoomTable.length - 1] >= intSize)
  {
    return $Env.zoomTable.length - 1;
  }
  else
  {

  var diff = [];
  var index = 0;

  $.each($Env.zoomTable, function (i, val) {
    diff[i] = Math.abs(intSize - val.value);
    index = diff[index] < diff[i] ? index : i;
  });
    return index;
  }
}
/******************************************************************************/
/* changeZoomLevel                                                            */
/******************************************************************************/
function changeZoomLevel()
{
  var objOptions = $("#timeline").k2goTimeline("getOptions");
  var intZoomRange = parseInt($("#zoom-range").val(), 10);

  $("#slider_label").html       ($Env.zoomTable[intZoomRange].name); 
  $("#button_minus").toggleClass("disable",  intZoomRange == 0);
  $("#button_plus" ).toggleClass("disable",  intZoomRange == $Env.zoomTable.length - 1);
  $("#date"        ).toggleClass("expansion",objOptions.scale <= 40);
}
/******************************************************************************/
/* getQueryString                                                             */
/******************************************************************************/
function getQueryString(pParameters)
{
  var objGetQueryString = {};
  var arrParameters     = pParameters.substring(1).split("&");

  for( var i = 0; i < arrParameters.length; i++)
  {
    objGetQueryString[decodeURIComponent(arrParameters[i].split("=")[0])] = decodeURIComponent(arrParameters[i].split("=")[1]);
  }
  return objGetQueryString;
}
/******************************************************************************/
/* putEventInfo                                                               */
/******************************************************************************/
function putEventInfo(pEvent)
{
  $("#event_info").html(pEvent);
  // console.log("[" + (new Date()).toISOString() + "]" + pEvent);
}
