/******************************************************************************/
/* main.js                                                                     */
/* Copyright (c) NICT. All rights reserved.                                   */
/* See License.txt for the license information.                               */
/******************************************************************************/

/******************************************************************************/
/* window.load                                                                */
/******************************************************************************/
$(window).on("load", function()
{
/*-----* view url *-----------------------------------------------------------*/
if (window.location.search.length > 1)
{
  var objGetQueryString = getQueryString(window.location.search);

  if ( objGetQueryString.st != undefined && objGetQueryString.st.match(/^[\d\-]+$/) ) $Env.startTime  .setTime(parseInt(objGetQueryString.st, 10));
  if ( objGetQueryString.et != undefined && objGetQueryString.et.match(/^[\d\-]+$/) ) $Env.endTime    .setTime(parseInt(objGetQueryString.et, 10));
  if ( objGetQueryString.ct != undefined && objGetQueryString.ct.match(/^[\d\-]+$/) ) $Env.currentTime.setTime(parseInt(objGetQueryString.ct, 10));
  
  if ( objGetQueryString.lng != undefined && isFinite(objGetQueryString.lng) )  $Env.lng=objGetQueryString.lng;
  if ( objGetQueryString.lat != undefined && isFinite(objGetQueryString.lat) )  $Env.lat=objGetQueryString.lat;
  if ( objGetQueryString.zl != undefined && isFinite(objGetQueryString.zl) )  $Env.zoomLevel=objGetQueryString.zl;

  if ( objGetQueryString.br != undefined && isFinite(objGetQueryString.br) )  $Env.bearing=objGetQueryString.br;
  if ( objGetQueryString.pitch != undefined && isFinite(objGetQueryString.pitch) )  $Env.pitch=objGetQueryString.pitch;

  if ( objGetQueryString.bmap != undefined ) $Env.baseMapId=objGetQueryString.bmap;
  if ( objGetQueryString.layerIds != undefined )  $Env.layerIds=objGetQueryString.layerIds.split(',');

  // mapのcenterとzoomを更新
  iframe = document.getElementById("map");
  if(iframe != undefined ){
    if ($Env.baseMapId != null){
      iframe.contentWindow.setBaseMap($Env.baseMapId);
    }

    iframe.contentWindow.setCenterZoom($Env.lng, $Env.lat, $Env.zoomLevel, $Env.bearing, $Env.pitch);

    if($Env.layerIds != null){
      iframe.contentWindow.setLayerVisible($Env.layerIds)
    }
  }

}

/*-----* timeline *-----------------------------------------------------------*/
  $("#lockWindow").addClass("show");

  $("#timeline").k2goTimeline(
  {
    minTime          : new Date($Env.minTime    .getTime()),
    maxTime          : new Date($Env.maxTime    .getTime()),
    startTime        : new Date($Env.startTime  .getTime()),
    endTime          : new Date($Env.endTime    .getTime()),
    currentTime      : new Date($Env.currentTime.getTime()),
    pickLineDistance : { element : $("#main"), position : "bottom" },
    syncPickAndBar   : true,
    timeChange       : function(pTimeInfo)
    {
      $("#date"             ).html($("#timeline").k2goTimeline("formatDate", pTimeInfo.currentTime, "%y-%mm-%dd %H:%M:%S.%N"));
      $("#current_time span").html($("#timeline").k2goTimeline("formatDate", pTimeInfo.currentTime, "%y-%mm-%dd %H:%M:%S"   ));
      $("#start_time   span").html($("#timeline").k2goTimeline("formatDate", pTimeInfo.startTime  , "%y-%mm-%dd %H:%M:%S"   ));
      $("#end_time     span").html($("#timeline").k2goTimeline("formatDate", pTimeInfo.endTime    , "%y-%mm-%dd %H:%M:%S"   ));

      if ($("#current_time").hasClass("timeNow"))
      {
        $("#current_time").removeClass("timeNow"    );
        $("#current_time").addClass   ("timeCurrent");

        clearTimeout($("#current_time").data("removeTimeNow"));
      }

      var $current_p = pTimeInfo.currentTime; 

      //URL書き換え
      const url = new URL(location);
      url.searchParams.set("dt", formatDate($current_p, 'YYYYMMDDhhmm'));

      // 再利用しないパラメータは削除
      url.searchParams.delete("st");
      url.searchParams.delete("et");
      url.searchParams.delete("ct");
      url.searchParams.delete("lng");
      url.searchParams.delete("lat");
      url.searchParams.delete("zl");
      url.searchParams.delete("br");
      url.searchParams.delete("pitch");

      url.searchParams.delete("bmap");
      url.searchParams.delete("layerIds");

      history.replaceState('','',url.pathname + url.search);

      // 連続画面キャプチャの処理
      var fileName = formatDate($current_p, 'YYYYMMDD_hhmmss') + ".jpg"

      // console.log("layer_update call.")

      // 地図を更新
      iframe = document.getElementById("map");
      iframe.contentWindow.layer_update(fileName,$current_p);

    },
    rangeChange : function(pTimeInfo)
    {
      adjustCurrentTime();

      $("#range_start_time span").html($("#timeline").k2goTimeline("formatDate", pTimeInfo.rangeStartTime, "%y-%mm-%dd %H:%M:%S"));
      $("#range_end_time   span").html($("#timeline").k2goTimeline("formatDate", pTimeInfo.rangeEndTime  , "%y-%mm-%dd %H:%M:%S"));
    },
    railClick      : function(pTimeInfo) { adjustCurrentTime(); putEventInfo("rail click"      ); },
    pickTapHold    : function(pTimeInfo) {                      putEventInfo("pick tap hold"   ); },
    pickMoveStart  : function(pTimeInfo) {                      putEventInfo("pick move start" ); },
    pickMove       : function(pTimeInfo) {                      putEventInfo("pick move"       ); },
    pickMoveEnd    : function(pTimeInfo) { adjustCurrentTime(); putEventInfo("pick move end"   ); },
    barMoveStart   : function(pTimeInfo) { adjustCurrentTime(); putEventInfo("bar  move start" ); },
    barMove        : function(pTimeInfo) {                      putEventInfo("bar  move"       ); },
    barMoveEnd     : function(pTimeInfo) { adjustRangeBar   (); putEventInfo("bar  move end"   ); },
    zoomStart      : function(pTimeInfo) {                      putEventInfo("zoom start"      ); },
    zoom           : function(pTimeInfo) {                      putEventInfo("zoom"            ); },
    zoomEnd        : function(pTimeInfo) { adjustRangeBar   (); putEventInfo("zoom end"        ); },
    rangeMoveStart : function(pTimeInfo) {                      putEventInfo("range move start"); },
    rangeMove      : function(pTimeInfo) {                      putEventInfo("range move"      ); },
    rangeMoveEnd   : function(pTimeInfo)
    {
      var objOptions   = $("#timeline").k2goTimeline("getOptions");
      var objStartTime = objOptions.minTime.getTime() > objOptions.startTime.getTime() ? objOptions.minTime : objOptions.startTime;
      var objEndTime   = objOptions.maxTime.getTime() < objOptions.endTime  .getTime() ? objOptions.maxTime : objOptions.endTime;

      if (pTimeInfo.rangeStartTime < objStartTime)
      {
        objEndTime = new Date(objStartTime.getTime() + (pTimeInfo.rangeEndTime.getTime() - pTimeInfo.rangeStartTime.getTime()));
        $("#timeline").k2goTimeline("showRangeBar", { rangeStartTime : new Date(objStartTime.getTime()), rangeEndTime : new Date(objEndTime.getTime()) });
      }
      else if (pTimeInfo.rangeEndTime > objEndTime)
      {
        objStartTime = new Date(objEndTime.getTime() - (pTimeInfo.rangeEndTime.getTime() - pTimeInfo.rangeStartTime.getTime()));
        $("#timeline").k2goTimeline("showRangeBar", { rangeStartTime : new Date(objStartTime.getTime()), rangeEndTime : new Date(objEndTime.getTime()) });
      }
      else
      {
        objStartTime = pTimeInfo.rangeStartTime;
        objEndTime   = pTimeInfo.rangeEndTime;
      }

      $("#range_start_time span").html($("#timeline").k2goTimeline("formatDate", objStartTime, "%y-%mm-%dd %H:%M:%S"));
      $("#range_end_time   span").html($("#timeline").k2goTimeline("formatDate", objEndTime  , "%y-%mm-%dd %H:%M:%S"));

      putEventInfo("range move end");
    }
  },
  function(pTimeInfo)
  {
    var objOptions        = $("#timeline").k2goTimeline("getOptions");
    var objRangeStartTime = new Date(objOptions.currentTime.getTime() - $("#timeline").width() / 16 * objOptions.scale);
    var objRangeEndTime   = new Date(objOptions.currentTime.getTime() + $("#timeline").width() / 16 * objOptions.scale);

    $("#min_time         span").html($("#timeline").k2goTimeline("formatDate", objOptions.minTime, "%y-%mm-%dd %H:%M:%S"));
    $("#max_time         span").html($("#timeline").k2goTimeline("formatDate", objOptions.maxTime, "%y-%mm-%dd %H:%M:%S"));
    $("#range_start_time span").html($("#timeline").k2goTimeline("formatDate", objRangeStartTime , "%y-%mm-%dd %H:%M:%S"));
    $("#range_end_time   span").html($("#timeline").k2goTimeline("formatDate", objRangeEndTime   , "%y-%mm-%dd %H:%M:%S"));
    $("#zoom-range"           ).attr("max", $Env.zoomTable.length - 1);

    $("#timeline").k2goTimeline("setOptions", { rangeStartTime : objRangeStartTime, rangeEndTime : objRangeEndTime });
    $(window     ).trigger     ("resize");

    $("#lockWindow").removeClass ("show");
    putEventInfo("after initialize");
  });
/*-----* pickadate *----------------------------------------------------------*/
  $("#date_box #cal").pickadate(
  {
    selectYears : true,
    // selectMonths : true,
    clear       : false,
    onOpen      : function()
    {
      var objOptions = $("timeline").k2goTimeline("getOptions");

      this.set("min"   , new Date(objOptions.minTime    .getTime()    ));
      this.set("max"   , new Date(objOptions.maxTime    .getTime() - 1));
      this.set("select", new Date(objOptions.currentTime.getTime()    ));
    },
    onClose : function()
    {
      var objOptions = $("timeline").k2goTimeline("getOptions");
      var objDate    = new Date(this.get("select", "yyyy/mm/dd") + $("#timeline").k2goTimeline("formatDate", objOptions.currentTime, " %H:%M:%S"));

      objDate.setMilliseconds(objOptions.currentTime.getMilliseconds());

      if(objOptions.currentTime.getTime() != objDate.getTime())
      {
        var objTimeInfo = {};

        objTimeInfo.minTime     = new Date(objOptions.minTime    .getTime());
        objTimeInfo.maxTime     = new Date(objOptions.maxTime    .getTime());
        objTimeInfo.startTime   = new Date(objOptions.minTime    .getTime() > objOptions.startTime.getTime() ? objOptions.minTime.getTime() : objOptions.startTime.getTime());
        objTimeInfo.endTime     = new Date(objOptions.maxTime    .getTime() < objOptions.endTime  .getTime() ? objOptions.maxTime.getTime() : objOptions.endTime  .getTime());
        objTimeInfo.currentTime = new Date(objOptions.currentTime.getTime());

        var intDiff1 = objTimeInfo.currentTime.getTime() - objTimeInfo.startTime  .getTime();
        var intDiff2 = objTimeInfo.endTime    .getTime() - objTimeInfo.currentTime.getTime();

        objTimeInfo.currentTime.setTime(objDate.getTime());
        objTimeInfo.startTime  .setTime(objDate.getTime() - intDiff1);
        objTimeInfo.endTime    .setTime(objDate.getTime() + intDiff2);

        if (objOptions.minTime.getTime() > objTimeInfo.startTime.getTime()) objTimeInfo.startTime.setTime(objOptions.minTime.getTime());
        if (objOptions.maxTime.getTime() < objTimeInfo.endTime  .getTime()) objTimeInfo.endTime  .setTime(objOptions.maxTime.getTime());

        $Env.creating = true;
        $("#lockWindow").addClass("show");

        $("#timeline").k2goTimeline("create",
        {
          timeInfo : objTimeInfo,
          callback : function(pTimeInfo)
          {
            adjustRangeBar();
            $Env.creating = false;
            putEventInfo("select picker date");
            $("#lockWindow").removeClass("show");
          }
        });
      }
    }
  });
});$(function() {
$(window).on("focus", function () { // これがないと画面に戻った時に勝手にカレンダーが表示される
  $(document.activeElement).blur();
});
/******************************************************************************/
/* window.resize                                                              */
/******************************************************************************/
$(window).on("resize", function()
{
  if (typeof $(window).data("resize") == "number")
  {
    clearTimeout($(window).data("resize"));
    $(window).removeData("resize");
  }

  $(window).data("resize", setTimeout(function()
  {
    adjustRangeBar();

    $("#timeline").k2goTimeline("setOptions", { maxScale : $Env.zoomTable[0].value / $("#timeline").width(), minScale : $Env.zoomTable[$Env.zoomTable.length - 1].value / $("#timeline").width() });

    putEventInfo("resize");
    $(window).removeData("resize");
  }, 300));
});
/******************************************************************************/
/* document.mousemove                                                         */
/******************************************************************************/
$(document).on("mousemove", function(pEvent)
{
  var $rangeBar = $(".k2go-timeline-range-show");

  if ($rangeBar.length > 0)
  {
    var intLeft  = $rangeBar.offset().left;
    var intRight = $rangeBar.width () + intLeft;

    $("#timeline").k2goTimeline("setOptions", { disableZoom : !(intLeft <= pEvent.pageX && pEvent.pageX <= intRight) });
  }
});
/******************************************************************************/
/* current_time.click                                                         */
/******************************************************************************/
$("#current_time").on("click", function()
{
  var $this = $(this);
/*-----* time current *-------------------------------------------------------*/
  if($this.hasClass("timeCurrent"))
  {
    var objOptions  = $("timeline").k2goTimeline("getOptions");
    var objTimeInfo = {};

    objTimeInfo.minTime     = new Date(objOptions.minTime    .getTime());
    objTimeInfo.maxTime     = new Date(objOptions.maxTime    .getTime());
    objTimeInfo.startTime   = new Date(objOptions.minTime    .getTime() > objOptions.startTime.getTime() ? objOptions.minTime.getTime() : objOptions.startTime.getTime());
    objTimeInfo.endTime     = new Date(objOptions.maxTime    .getTime() < objOptions.endTime  .getTime() ? objOptions.maxTime.getTime() : objOptions.endTime  .getTime());
    objTimeInfo.currentTime = new Date(objOptions.currentTime.getTime());

    var intDiff1 = objTimeInfo.currentTime.getTime() - objTimeInfo.startTime  .getTime();
    var intDiff2 = objTimeInfo.endTime    .getTime() - objTimeInfo.currentTime.getTime();

    objTimeInfo.currentTime.setTime(Date.now());
    objTimeInfo.startTime  .setTime(objTimeInfo.currentTime.getTime() - intDiff1);
    objTimeInfo.endTime    .setTime(objTimeInfo.currentTime.getTime() + intDiff2);

    if (objOptions.minTime.getTime() > objTimeInfo.startTime.getTime()) objTimeInfo.startTime.setTime(objOptions.minTime.getTime());
    if (objOptions.maxTime.getTime() < objTimeInfo.endTime  .getTime()) objTimeInfo.endTime  .setTime(objOptions.maxTime.getTime());

    $Env.creating = true;
    $("#lockWindow").addClass("show");

    $("#timeline").k2goTimeline("create",
    {
      timeInfo : objTimeInfo,
      callback : function(pTimeInfo)
      {
        $this.data("removeTimeNow", setTimeout(function()
        {
           $this.removeClass("timeNow"    );
           $this.addClass   ("timeCurrent");
        }, 5000));
        
        $this.addClass   ("timeNow"    );
        $this.removeClass("timeCurrent");

        $Env.creating = false;
        adjustRangeBar();
        putEventInfo("change time now");
        $("#lockWindow").removeClass("show");
      }
    });
  }
/*-----* time now *-----------------------------------------------------------*/
  else if ($this.hasClass("timeNow"))
  {
    clearTimeout($("#current_time").data("removeTimeNow"));
    
    $this.addClass   ("timeNowPlay");
    $this.removeClass("timeNow"    );

    $("#cal"         ).addClass("disable2");
    $("#play_box"    ).addClass("disable2");
    $("#slider"      ).addClass("disable2");
    $("#button_range").addClass("disable2");
    
    $Env.starting = true;

    $("#timeline").k2goTimeline("start",
    {
      fps      : 10,
      realTime : true,
      stop     : function()
      {
        $("#cal"         ).removeClass("disable2"   );
        $("#play_box"    ).removeClass("disable2"   );
        $("#slider"      ).removeClass("disable2"   );
        $("#button_range").removeClass("disable2"   );
        $("#lockWindow"  ).removeClass("show"       );
        $this             .addClass   ("timeCurrent");
        $this             .removeClass("timeNowPlay");
        $this             .trigger    ("click"      );
        adjustRangeBar();
        $Env.starting = false;
      }
    });
  }
/*-----* time now play *------------------------------------------------------*/
  else
  {
    $("#lockWindow").addClass    ("show");
    $("#timeline"  ).k2goTimeline("stop");
  }
});
/******************************************************************************/
/* view_url event                                                             */
/******************************************************************************/
/*-----* button_view_url.click *----------------------------------------------*/
$("#button_view_url").on("click", function()
{

  var lng = ""
  var lat = ""

  iframe = document.getElementById("map");
  const center = iframe.contentWindow.getCenter();
  const zoom_level = iframe.contentWindow.getZoom();
  const bearing = iframe.contentWindow.getBearing();
  const pitch = iframe.contentWindow.getPitch();

  const base_map_id = iframe.contentWindow.getBaseMapInfo();
  const layer_ids = iframe.contentWindow.getLayerIdsWithOpacity();

  if(center != undefined){
    lng = center['lng'];
    lat =center['lat'];
  }

  var strUurl = window.location.origin + window.location.pathname + "?" 
  + "st=" + $Env.startTime.getTime() 
  + "&et=" + $Env.endTime.getTime() 
  + "&ct=" + $Env.currentTime.getTime()
  + "&lng=" + lng
  + "&lat=" + lat
  + "&zl=" + zoom_level
  + "&br=" + bearing
  + "&pitch=" + pitch
  + "&bmap=" + base_map_id
  + "&layerIds=" + layer_ids
  ;

  $("#view_url_input"    ).val    (strUurl);
  $("#view_url_input"    ).attr   ("aria-label" , strUurl );
  $("#view_url"          ).css    ("display" , "block");
  $(".input_group_button").trigger("click");
});
/*-----* input_group_button.click *--------------------------------------------*/
$(".input_group_button").on("click", function()
{
  $("#view_url_input").select();
  document.execCommand("Copy");
});
/*-----* view_url_box_close.click *-------------------------------------------*/
$(".view_url_box_close").on("click", function()
{
  $("#view_url").css("display" , "none");
});
/******************************************************************************/
/* play_box.click                                                             */
/******************************************************************************/
$("#play_box").on("click", "a", function()
{
  var $this       = $(this);
  var flgStarting = $Env.starting;
  var intSpeed    = $Env.speed;

  $("#lockWindow").addClass    ("show");
  $("#timeline"  ).k2goTimeline("stop");

  setTimeout(function _sleep()
  {
    if ($Env.starting)
    {
      setTimeout(_sleep, 10);
      return;
    }

    $Env.speed = intSpeed;

    if ($this.attr("id") == "button_play" || $this.attr("id") == "button_play_reverse" ){
        // 再生またはコマ送りのときだけ撮影
        iframe.contentWindow.setActiveFlg(true)

    }        


/*-----* play *-----------------------------------------------------*/
    if ($this.attr("id") == "button_play")
    { 
      // 通常
      if($('#play-mode-normal').hasClass('active')) {
        $Env.speed = $Env.playTable[ $('#play-speed2').val() - 1 ];

        startTimeline();
        $("#lockWindow").removeClass("show");
        console.log('通常再生中');

      // コマ
      } else {
        if($("#button_play").hasClass("play_frame") == false){
          // 開始時点をキャプチャしておく
          var fileName = $("#timeline").k2goTimeline("formatDate", $("#timeline").k2goTimeline("getOptions").currentTime, "%y%mm%dd_%H%M%S.jpg")
          iframe.contentWindow.getDisplayCapture2(fileName);    

          clearTimeout($Env.timeoutIdBack);
          $('#button_play').addClass('play_frame');
          $("#button_play_reverse").removeClass("play_frame_rev");
          framePlayFwd();
          console.log('コマ再生開始');
        }
      }
    }
/*-----* reverse *-----------------------------------------------------*/
    else if ($this.attr("id") == "button_play_reverse") {
      if($('#play-mode-normal').hasClass('active')) {
        // 逆の通常
        $Env.speed = -($Env.playTable[ $('#play-speed2').val() - 1 ]); // マイナスにする

        startTimeline();
        $("#lockWindow").removeClass("show");
        console.log('逆再生中');

      // コマ
      } else {
        if($("#button_play_reverse").hasClass("play_frame_rev") == false){
          // 開始時点をキャプチャしておく
          var fileName = $("#timeline").k2goTimeline("formatDate", $("#timeline").k2goTimeline("getOptions").currentTime, "%y%mm%dd_%H%M%S.jpg")
          iframe.contentWindow.getDisplayCapture2(fileName);    

          clearTimeout($Env.timeoutIdFwd);
          $("#button_play").removeClass("play_frame");
          $("#button_play_reverse").addClass("play_frame_rev");
          framePlayBack();
          console.log('逆コマ再生開始');
        }
      }
    }
/*-----* stop *---------------------------------------------------------------*/
    else if ($this.attr("id") == "button_stop")
    {
      $Env.speed = 0;
      $("#lockWindow").removeClass("show");
    }
/*-----* loop *---------------------------------------------------------------*/
    else if ($this.attr("id") == "button_loop")
    {
      $this.toggleClass("active");
      $Env.loop = $this.hasClass("active");
      if (flgStarting) startTimeline();
      $("#lockWindow").removeClass("show");
    }
/*-----* fwd or back *--------------------------------------------------------*/
    else
    {
      $Env.creating = true;

      var objOptions  = $("#timeline").k2goTimeline("getOptions");
      var objTimeInfo = {};
      var objEdgeStartTime;
      var objEdgeEndTime;
      var intDiff;

      objTimeInfo.minTime     = new Date(objOptions.minTime    .getTime());
      objTimeInfo.maxTime     = new Date(objOptions.maxTime    .getTime());
      objTimeInfo.startTime   = new Date(objOptions.minTime    .getTime() > objOptions.startTime.getTime() ? objOptions.minTime.getTime() : objOptions.startTime.getTime());
      objTimeInfo.endTime     = new Date(objOptions.maxTime    .getTime() < objOptions.endTime  .getTime() ? objOptions.maxTime.getTime() : objOptions.endTime  .getTime());
      objTimeInfo.currentTime = new Date(objOptions.currentTime.getTime());

      if ($("#button_range").hasClass("active"))
      {
        objEdgeStartTime = new Date(objOptions.rangeStartTime.getTime());
        objEdgeEndTime   = new Date(objOptions.rangeEndTime  .getTime());
      }
      else
      {
        objEdgeStartTime = new Date(objTimeInfo.startTime.getTime());
        objEdgeEndTime   = new Date(objTimeInfo.endTime  .getTime());
      }

      intDiff = (objEdgeEndTime.getTime() - objEdgeStartTime.getTime()) * 0.01;

      if ($this.attr("id") == "button_back_edge")
      {
        console.log("button_back_edge clicked.")
        objTimeInfo.currentTime.setTime(objEdgeStartTime.getTime());
      }
      else if ($this.attr("id") == "button_fwd_edge")
      {
        objTimeInfo.currentTime.setTime(objEdgeEndTime.getTime());
      }
      else if ($this.attr("id") == "button_back")
      {
                                                                            objTimeInfo.currentTime.setTime(objTimeInfo.currentTime.getTime() - intDiff);
        if (objTimeInfo.currentTime.getTime() < objEdgeStartTime.getTime()) objTimeInfo.currentTime.setTime(objEdgeStartTime       .getTime()          );
      }
      else if ($this.attr("id") == "button_fwd")
      {
        objTimeInfo.currentTime.setTime(objTimeInfo.currentTime.getTime() + intDiff);
        if (objTimeInfo.currentTime.getTime() > objEdgeEndTime.getTime()) objTimeInfo.currentTime.setTime(objEdgeEndTime         .getTime()          );
      }

      $("#timeline").k2goTimeline("create",
      {
        timeInfo : objTimeInfo,
        callback : function(pTimeInfo)
        {
          if (flgStarting) startTimeline();
          $Env.creating = false;
          $("#lockWindow").removeClass("show");
        }
      });
    }
  }, 1);
});

$('#menuDiv+div').css('z-index','0');

// 再生設定メニューの表示
$(function(){
  $('#button_conf').on('click',function(){
    $('#panel-conf').show();
    $(this).css({
      'background': 'url(img/play_conf.svg) no-repeat center center',
      'background-size': '20px 20px'
    });

    // 再生設定メニューのカーソル移動
    $("#panel-conf").draggable({ 
      cursor: "move" 
    });

    //通常再生モードに切り替え
    $('#play-mode-normal').on('click', function() {
      if ( $Env.timeoutIdFwd ) { 
        clearTimeout($Env.timeoutIdFwd);
      };
      if ( $Env.timeoutIdBack) { 
        clearTimeout($Env.timeoutIdBack);
      };
      $(this).addClass("active");
      $Env.framePlay = false;

      $("#play-mode-span").removeClass("active");
      // $("#button_play_reverse").prop('disabled', true);
      $("#form-title-play-speed-title").html("再生速度");
      $("#display2").css("display" , "grid");
      $("#display1").css("display" , "none");
      $("#play-speed-wrapper2").css("display" , "grid");
      $("#play-speed-wrapper").css("display" , "none");
      $("#button_play").removeClass("play_frame");
      $("#button_play_reverse").removeClass("play_frame_rev");

      console.log("通常再生モード");
    });

    //コマ送り再生モードに切り替え
    $("#play-mode-span").on('click', function() {
      $(this).addClass("active");
      $Env.framePlay = true;
      $("#play-mode-normal").removeClass("active");
      // $("#button_play_reverse").prop('disabled', false);
      $("#form-title-play-speed-title").html("再生間隔");
      $("#display2").css("display", "none");
      $("#display1").css("display", "grid");
      $("#play-speed-wrapper2").css("display", "none");
      $("#play-speed-wrapper").css("display", "grid");     

      $("#button_play").removeClass("active");
      $("#button_play_reverse").removeClass("active");
      
      $("#button_play         span").html       ("");
      $("#button_play_reverse span").html       ("");

      // 通常再生を停止させる
      $Env.speed = 0;
      startTimeline();

      console.log("コマ送り再生モード");
    });
    
    return false;
  });

  // 再生設定メニューの非表示
  $('#panel-conf-close').on('click',function(){
    $('#panel-conf').hide();
    $('#button_conf').css({
      'background': 'url(img/play_conf_yellow.svg) no-repeat center center',
      'background-size': '20px 20px'
    });
    return false;
  });
  
});

//停止ボタン処理
$('#button_stop').on('click', function() {
  $("#button_play").removeClass("play_frame");
  $("#button_play").removeClass("active");
  $("#button_play_reverse").removeClass("play_frame_rev");
  $("#button_play_reverse").removeClass("active");
  // if ($Env.framePlay) {
  //   clearTimeout($Env.timeoutIdFwd);
  //   clearTimeout($Env.timeoutIdBack);
  // } else {
  //   clearTimeout($Env.timeoutIdFwd);
  // };
  clearTimeout($Env.timeoutIdFwd);
  clearTimeout($Env.timeoutIdBack);

  // 連続画面キャプチャの停止(再開可能)
  if($("#button_multi_capture").hasClass("active")){
    if (iframe.contentWindow.getActiveFlg() == true){
      // 停止する時点もキャプチャしておく
      iframe.contentWindow.getDisplayCapture2('end');    

      iframe.contentWindow.setActiveFlg(false);
    }
  }

  console.log("CLICK!! STOP!!");
});


//再生速度の数値とレンジスライダーを同期
$('#play-speed2').on('input change', function () {
  var calcTime = makeTime($Env.playTable[ $(this).val() - 1 ] * 60);
  $('#display2').html("x" + $Env.playTable[ $(this).val() - 1 ] + " (" + calcTime + "/sec)");
  $Env.speed = $Env.playTable[ $(this).val() - 1 ];

  if($('#button_play').hasClass('active') || $('#button_play_reverse').hasClass('active')) {
    if($('#button_play_reverse').hasClass('active')) {
      // 逆再生のときはマイナスにする 
      $Env.speed = -($Env.speed)
    }
    startTimeline();
  }
});

//再生間隔（コマ送り）の数値とレンジスライダーを同期
$('#play-speed').on('input change', function () {
  $('#display1').html($(this).val() + "sec");
  $Env.playInterval = $(this).val();
  clearTimeout($Env.timeoutIdFwd);
  clearTimeout($Env.timeoutIdBack);
  if($('#button_play').hasClass('play_frame')) {
    framePlayFwd();
  }else if($('#button_play_reverse').hasClass('play_frame_rev')) {
    framePlayBack();
  }
});

//コマ送り間隔の数値がレンジスライダーと同時に変動
$('#play-span').on('input change', function () {
  console.log("play-span val:", $(this).val())
  $('#frame').html( $(this).val() + 'f');
  $('#time').html( makeTime(Math.round($(this).val() * 60)) );
  $Env.frameInterval = Math.round($(this).val());
});

/******************************************************************************/
/* zoom-range event                                                           */
/******************************************************************************/
/*-----* zoom-range.input *---------------------------------------------------*/
$("#zoom-range").on("input", function()
{
  changeZoomLevel()
  
  if (!$Env.creating)
  {
    
    var intValue = parseInt($(this).val(), 10);

    if (intValue != getZoomLevel())
    {
      $Env.creating = true;

      var objOptions         = $("#timeline").k2goTimeline("getOptions");
      var objZoomInfo        = $Env.zoomTable[intValue];
      var objOffsetPixelInfo = {}; // ピクセルサイズを格納
      var objTimeInfo        = {}; // Date オブジェクト格納
      var intPixelSize;
      
      objOffsetPixelInfo.startTime   = $("#timeline").k2goTimeline("getOffsetFromTime", objOptions.minTime.getTime() > objOptions.startTime.getTime() ? objOptions.minTime : objOptions.startTime);
      objOffsetPixelInfo.endTime     = $("#timeline").k2goTimeline("getOffsetFromTime", objOptions.maxTime.getTime() < objOptions.endTime  .getTime() ? objOptions.maxTime : objOptions.endTime  );
      objOffsetPixelInfo.currentTime = $("#timeline").k2goTimeline("getOffsetFromTime", objOptions.currentTime);
      
      intPixelSize = objZoomInfo.value / (objOffsetPixelInfo.endTime - objOffsetPixelInfo.startTime);

      objTimeInfo.minTime      = new Date(objOptions.minTime    .getTime());
      objTimeInfo.maxTime      = new Date(objOptions.maxTime    .getTime());
      objTimeInfo.currentTime  = new Date(objOptions.currentTime.getTime());
      objTimeInfo.startTime    = new Date(objOptions.currentTime.getTime() - intPixelSize * (objOffsetPixelInfo.currentTime - objOffsetPixelInfo.startTime  ));
      objTimeInfo.endTime      = new Date(objOptions.currentTime.getTime() + intPixelSize * (objOffsetPixelInfo.endTime     - objOffsetPixelInfo.currentTime));
      
      if( objTimeInfo.startTime.getTime() < objTimeInfo.minTime.getTime() ) objTimeInfo.startTime.setTime(objTimeInfo.minTime.getTime()) ;
      if( objTimeInfo.endTime  .getTime() > objTimeInfo.maxTime.getTime() ) objTimeInfo.endTime  .setTime(objTimeInfo.maxTime.getTime()) ;

      $("#timeline").k2goTimeline("create",
      {
        timeInfo : objTimeInfo,
        callback : function(pTimeInfo)
        {
          $Env.creating = false;
          $("#zoom-range").trigger("input");
        }
      });
    }
  }
});

/*-----* zoom-range.change *--------------------------------------------------*/
$("#zoom-range").on("change", function()
{
  adjustRangeBar();
});
/*-----* plus or minus.click *------------------------------------------------*/
$("#slider").on("click", "> a", function()
{
  var intValue = parseInt($("#zoom-range").val(), 10);

  if ($(this).attr("id") == "button_minus") intValue --; 
  else                                      intValue ++;                  

  $("#zoom-range").val(intValue)
  $("#zoom-range").trigger("input" );
  $("#zoom-range").trigger("change");
});
/******************************************************************************/
/* button_range.click                                                         */
/******************************************************************************/
$("#button_range").on("click", function()
{
  $(this).toggleClass("active");
  
  if ($(this).hasClass("active"))
  {
    $(".k2go-timeline-rail"    ).css     ({ pointerEvents : "none"   });
    $(".k2go-timeline-rail > *").css     ({ pointerEvents : "auto"   });
    $("#button_loop"           ).css     ({ visibility    : "visible"}); 
    $("#cal"                   ).addClass("disable1");
    $("#current_time"          ).addClass("disable1");

    if (checkRangeBar())
    {
      $("#timeline").k2goTimeline("showRangeBar");
    }
    else
    {
      var objOptions        = $("#timeline").k2goTimeline("getOptions");
      var objStartTime      = new Date(objOptions .minTime   .getTime() > objOptions.startTime.getTime() ? objOptions.minTime.getTime() : objOptions.startTime.getTime());
      var objEndTime        = new Date(objOptions .maxTime   .getTime() < objOptions.endTime  .getTime() ? objOptions.maxTime.getTime() : objOptions.endTime  .getTime());
      var objRangeStartTime = new Date(objOptions.currentTime.getTime() - $("#timeline").width() / 16 * objOptions.scale);
      var objRangeEndTime   = new Date(objOptions.currentTime.getTime() + $("#timeline").width() / 16 * objOptions.scale);

      if (objRangeStartTime.getTime() < objStartTime.getTime())
      {
        objRangeStartTime = new Date(objStartTime.getTime());
        objRangeEndTime   = new Date(objStartTime.getTime() + $("#timeline").width() / 8 * objOptions.scale);
      }

      if (objRangeEndTime.getTime() > objEndTime.getTime())
      {
        objRangeEndTime   = new Date(objEndTime.getTime());
        objRangeStartTime = new Date(objEndTime.getTime() - $("#timeline").width() / 8 * objOptions.scale);
      }

      $("#timeline").k2goTimeline("showRangeBar", { rangeStartTime : objRangeStartTime, rangeEndTime : objRangeEndTime });
      objOptions    .rangeChange (                { rangeStartTime : objRangeStartTime, rangeEndTime : objRangeEndTime });
    }
  }
  else
  {
    $("#timeline"              ).k2goTimeline("hiddenRangeBar");
    $("#timeline"              ).k2goTimeline("setOptions", { disableZoom : false });
    $(".k2go-timeline-rail"    ).css         ({ pointerEvents  : "" });
    $(".k2go-timeline-rail > *").css         ({ pointerEvents  : "" });
    $("#button_loop"           ).css         ({ visibility: "hidden"}); 
    $("#button_loop"           ).removeClass ("active"); 
    $("#cal"                   ).removeClass ("disable1");
    $("#current_time"          ).removeClass ("disable1");

    $Env.loop = false;
  }
});

$("#button_single_capture").on("click", function(){
  var fileName = $("#timeline").k2goTimeline("formatDate", $("#timeline").k2goTimeline("getOptions").currentTime, "%y%mm%dd_%H%M%S.jpg")
  iframe.contentWindow.singleMapCapture(fileName);
});

$("#button_multi_capture").on("click", function() {
  $(this).toggleClass("active");

  const ret_activ = $("#button_multi_capture").hasClass("active");
  if(ret_activ){
    const btn_doc = $(this);
    iframe.contentWindow.startMapCapture(function(pResult) {
      if (!pResult.status) {
        btn_doc.toggleClass("active");
        btn_doc.toggleClass("hover");
      }
    }
    );
  }else{
    iframe.contentWindow.stopMapCapture();
    iframe.contentWindow.setActiveFlg(false);
  }

});


});



function formatDate (date, format) {
        var weekday = ["日", "月", "火", "水", "木", "金", "土"];
        if (!format) {
            format = 'YYYY/MM/DD(WW) hh:mm:ss'
        }
        format = format.replace(/YYYY/g, date.getFullYear());
        format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
        format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
        format = format.replace(/WW/g, weekday[date.getDay()]);
        format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
        format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
        format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
        return format;
}

function formatDateUTC (date, format) {
        var weekday = ["日", "月", "火", "水", "木", "金", "土"];
        if (!format) {
            format = 'YYYY/MM/DD(WW) hh:mm:ss'
        }
        format = format.replace(/YYYY/g, date.getUTCFullYear());
        format = format.replace(/MM/g, ('0' + (date.getUTCMonth() + 1)).slice(-2));
        format = format.replace(/DD/g, ('0' + date.getUTCDate()).slice(-2));
        format = format.replace(/WW/g, weekday[date.getUTCDay()]);
        format = format.replace(/hh/g, ('0' + date.getUTCHours()).slice(-2));
        format = format.replace(/mm/g, ('0' + date.getUTCMinutes()).slice(-2));
        format = format.replace(/ss/g, ('0' + date.getUTCSeconds()).slice(-2));
        return format;
}
