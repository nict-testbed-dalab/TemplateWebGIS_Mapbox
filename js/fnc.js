/******************************************************************************/
/* fnc.js                                                                     */
/* Copyright (c) NICT. All rights reserved.                                   */
/* See License.txt for the license information.                               */
/******************************************************************************/

/******************************************************************************/
/* adjustCurrentTime                                                          */
/******************************************************************************/
function adjustCurrentTime()
{
  var objOptions  = $("#timeline").k2goTimeline("getOptions");

  if ($(".k2go-timeline-range-show").length > 0)
  {
    if (objOptions.startTime.getTime() > objOptions.rangeEndTime.getTime() ||  objOptions.endTime  .getTime() < objOptions.rangeStartTime.getTime())
    {
      return;
    }
    else if (objOptions.currentTime.getTime() < objOptions.rangeStartTime.getTime())
    {
      var objTimeInfo = {};

      objTimeInfo.minTime     = new Date(objOptions .minTime    .getTime());
      objTimeInfo.maxTime     = new Date(objOptions .maxTime    .getTime());
      objTimeInfo.startTime   = new Date(objOptions .minTime    .getTime() > objOptions.startTime     .getTime() ? objOptions.minTime.getTime() : objOptions.startTime     .getTime());
      objTimeInfo.endTime     = new Date(objOptions .maxTime    .getTime() < objOptions.endTime       .getTime() ? objOptions.maxTime.getTime() : objOptions.endTime       .getTime());
      objTimeInfo.currentTime = new Date(objOptions .endTime    .getTime() < objOptions.rangeStartTime.getTime() ? objOptions.endTime.getTime() : objOptions.rangeStartTime.getTime());
      $Env       .currentTime = new Date(objTimeInfo.currentTime.getTime());
      $Env       .creating    = true;

      $("#timeline").k2goTimeline("create", { timeInfo : objTimeInfo, callback : function() { $Env.creating = false; } });
    }
    else if (objOptions.currentTime.getTime() > objOptions.rangeEndTime.getTime())
    {
      var objTimeInfo = {};

      objTimeInfo.minTime     = new Date(objOptions .minTime    .getTime());
      objTimeInfo.maxTime     = new Date(objOptions .maxTime    .getTime());
      objTimeInfo.startTime   = new Date(objOptions .minTime    .getTime() > objOptions.startTime   .getTime() ? objOptions.minTime  .getTime() : objOptions.startTime   .getTime());
      objTimeInfo.endTime     = new Date(objOptions .maxTime    .getTime() < objOptions.endTime     .getTime() ? objOptions.maxTime  .getTime() : objOptions.endTime     .getTime());
      objTimeInfo.currentTime = new Date(objOptions .startTime  .getTime() > objOptions.rangeEndTime.getTime() ? objOptions.startTime.getTime() : objOptions.rangeEndTime.getTime());
      $Env       .currentTime = new Date(objTimeInfo.currentTime.getTime());
      $Env       .creating    = true;

      $("#timeline").k2goTimeline("create", { timeInfo : objTimeInfo, callback : function() { $Env.creating = false; } });
    }
    else
      $Env.currentTime = new Date(objOptions.currentTime.getTime());
  }
  else
    $Env.currentTime = new Date(objOptions.currentTime.getTime());
}
/******************************************************************************/
/* checkRangeBar                                                              */
/******************************************************************************/
function checkRangeBar()
{
  var objOptions = $("#timeline").k2goTimeline("getOptions");

  return   objOptions.startTime     .getTime() <= objOptions.rangeStartTime.getTime() && objOptions.rangeEndTime.getTime() <= objOptions.endTime     .getTime()
       &&  objOptions.rangeStartTime.getTime() <= objOptions.currentTime   .getTime() && objOptions.currentTime .getTime() <= objOptions.rangeEndTime.getTime()
       && (objOptions.rangeEndTime  .getTime() -  objOptions.rangeStartTime.getTime()) / objOptions.scale >= $(".k2go-timeline-pick").width() * 3;
}
/******************************************************************************/
/* adjustRangeBar                                                             */
/******************************************************************************/
function adjustRangeBar()
{
  setTimeout(function _sleep()
  {
    if ($Env.creating)
    {
      setTimeout(_sleep, 10);
      return;
    }

    var objOptions = $("#timeline").k2goTimeline("getOptions");

    if ($(".k2go-timeline-range-show").length > 0)
    {
      if (checkRangeBar())
      {
        $Env.startTime   = new Date(objOptions.minTime    .getTime() > objOptions.startTime.getTime() ? objOptions.minTime.getTime() : objOptions.startTime.getTime());
        $Env.endTime     = new Date(objOptions.maxTime    .getTime() < objOptions.endTime  .getTime() ? objOptions.maxTime.getTime() : objOptions.endTime  .getTime());
        $Env.currentTime = new Date(objOptions.currentTime.getTime());

        $("#zoom-range").val(getZoomLevel());
        changeZoomLevel()
      }
      else
      {
        var objTimeInfo = {};

        objTimeInfo.minTime     = new Date($Env.minTime    .getTime());
        objTimeInfo.maxTime     = new Date($Env.maxTime    .getTime());
        objTimeInfo.startTime   = new Date($Env.startTime  .getTime());
        objTimeInfo.endTime     = new Date($Env.endTime    .getTime());
        objTimeInfo.currentTime = new Date($Env.currentTime.getTime());

        $Env.creating = true;
        $("#lockWindow").addClass("show");

        $("#timeline").k2goTimeline("create",
        {
          timeInfo : objTimeInfo,
          duration : 500,
          callback : function(pTimeInfo)
          {
            $("#zoom-range").val(getZoomLevel());
            changeZoomLevel()
            putEventInfo("after create method");
            $("#lockWindow").removeClass("show");
            $Env.creating = false;
          }
        });
      }
    }
    else
    {
      $Env.startTime   = new Date(objOptions.minTime    .getTime() > objOptions.startTime.getTime() ? objOptions.minTime.getTime() : objOptions.startTime.getTime());
      $Env.endTime     = new Date(objOptions.maxTime    .getTime() < objOptions.endTime  .getTime() ? objOptions.maxTime.getTime() : objOptions.endTime  .getTime());
      $Env.currentTime = new Date(objOptions.currentTime.getTime());
          
      $("#zoom-range").val(getZoomLevel());
      changeZoomLevel()
    }
  }, 1);
}
/******************************************************************************/
/* startTimeline                                                              */
/******************************************************************************/
function startTimeline()
{
  console.log("startTimeline start", $Env.speed)
  $Env.starting = true;
  $("#cal"         ).addClass("disable2");
  $("#current_time").addClass("disable2");
  $("#slider"      ).addClass("disable2");
  $("#button_range").addClass("disable2");

  // いったん両方を解除
  $("#button_play"             ).removeClass("active");
  $("#button_play_reverse"     ).removeClass("active");
  $("#button_play         span").html       ("");
  $("#button_play_reverse span").html       ("");

  // speedの符号でどちらを有効にするか判定
  if($Env.speed > 0)
  {
    $("#button_play"             ).addClass   ("active");
    $("#button_play         span").html       ($Env.speed);
  }
  else if($Env.speed < 0)
  {
    $("#button_play_reverse"     ).addClass   ("active");
    $("#button_play_reverse span").html       (-($Env.speed));
  }

  $("#timeline").k2goTimeline("start",
  {
    fps   : 10,
    speed : $Env.speed * 30,
    loop  : $Env.loop,
    stop  : function()
    {
      $("#button_play"             ).removeClass("active");
      $("#button_play_reverse"     ).removeClass("active");
      $("#button_play         span").html       ("");
      $("#button_play_reverse span").html       ("");
      $("#cal"                     ).removeClass("disable2");
      $("#current_time"            ).removeClass("disable2");
      $("#slider"                  ).removeClass("disable2");
      $("#button_range"            ).removeClass("disable2");
      adjustRangeBar();
      $Env.speed    = 0;
      $Env.starting = false;
    }
  });
}
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

function makeTime(num) {
  if (num < 60) {
    return num + "sec";
  } else {
    return num = (num / 60) + "min";
  }
};


/******************************************************************************/
/* framePlayFwd                                                               */
/* コマ送り再生の本処理                                                        */
/*   終点時間の判定をし、ループの場合は始点に戻る                               */
/******************************************************************************/
function framePlayFwd() {
  // $Env.currentTime.getTime() は更新されてないので使用しない
  const objOptions  = $("#timeline").k2goTimeline("getOptions");
  let target_current = objOptions.currentTime.getTime();
  let target_end = objOptions.endTime.getTime();

  if ($("#button_range").hasClass("active"))
  {
    // 範囲指定の場合
    target_end = objOptions.rangeEndTime.getTime()
  }

  if ($("#button_loop").hasClass("active")){
    // ループの場合（範囲指定の場合のみループ指定可能）
    // 時刻判定
    if (target_current < target_end){
      $("#button_fwd").trigger("click");
      $Env.timeoutIdFwd = setTimeout(framePlayFwd, $Env.playInterval * 1000);
      
    }else{
      // 終点時刻を超えた
      clearTimeout($Env.timeoutIdFwd);

      // rangeの左端に戻る
      $("#button_back_edge").trigger("click");
      $Env.timeoutIdFwd = setTimeout(framePlayFwd, $Env.playInterval * 1000);
    }

  } else {
    // ループなし（デフォルト）の場合
    if (target_current < target_end) {
      $("#button_fwd").trigger("click");
      $Env.timeoutIdFwd = setTimeout(framePlayFwd, $Env.playInterval * 1000);

    }else{
      // 停止
      $("#button_stop").trigger("click");
      $("#button_play").removeClass("play_frame");
    }
  }
};

/******************************************************************************/
/* framePlayBack                                                               */
/* 逆コマ送り再生の本処理                                                       */
/*   始点時間の判定をし、ループの場合は終点に戻る                               */
/******************************************************************************/
function framePlayBack() {
  // $Env.currentTime.getTime() は更新されてないので使用しない
  const objOptions  = $("#timeline").k2goTimeline("getOptions");
  let target_current = objOptions.currentTime.getTime();
  let target_start = objOptions.startTime.getTime();

  if ($("#button_range").hasClass("active"))
  {
    // 範囲指定の場合
    target_start = objOptions.rangeStartTime.getTime()
  }

  if ($("#button_loop").hasClass("active")){
    // ループの場合（範囲指定の場合のみループ指定可能）
    // 時刻判定
    if (target_current > target_start){
      $("#button_back").trigger("click");
      $Env.timeoutIdBack = setTimeout(framePlayBack, $Env.playInterval * 1000);
      
    }else{
      // 終点（左端）を超えた
      clearTimeout($Env.timeoutIdBack);

      // rangeの始点（右端）に戻る
      $("#button_fwd_edge").trigger("click");
      $Env.timeoutIdBack = setTimeout(framePlayBack, $Env.playInterval * 1000);
    }

  } else {
    // ループなし（デフォルト）の場合
    if (target_current > target_start) {
      $("#button_back").trigger("click");
      $Env.timeoutIdBack = setTimeout(framePlayBack, $Env.playInterval * 1000);

    }else{
      // 停止
      $("#button_stop").trigger("click");
      $("#button_play_reverse").removeClass("play_frame_rev");
    }
  }
};



