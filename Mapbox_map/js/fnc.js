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


/******************************************************************************/
// 要素移動
/******************************************************************************/
(function(){

  //要素の取得
  var elements = document.getElementsByClassName("drag-and-drop");

  //要素内のクリックされた位置を取得する変数
  var prepro_menu_x;
  var prepro_menu_y;

  //マウスが要素内で押されたとき、又はタッチされたとき発火
  for(var i = 0; i < elements.length; i++) {
      elements[i].addEventListener("mousedown", mousedown, false);
  }

  //マウスが押された際の関数
  function mousedown(e) {
      // ボタン押下時は処理しない(Divだったら処理する)
      if (!(e.target instanceof HTMLDivElement)) {
        console.log("mdown : not DIV")
        return;
      }

      //クラス名に .drag を追加
      this.classList.add("drag2");

      //マウスのイベントの差異を吸収
      //要素内の相対座標を取得
      prepro_menu_x = e.pageX - this.offsetLeft;
      prepro_menu_y = e.pageY - this.offsetTop;

      //ムーブイベントにコールバック
      document.body.addEventListener("mousemove", mousemove, false);
  }

  //マウスカーソルが動いたとき
  function mousemove(e) {

      //フリックしたときに画面を動かさないようにデフォルト動作を抑制
      e.preventDefault();

      //マウスが動いた場所に要素を動かす
      //ドラッグしている要素を取得
      var drag = document.getElementsByClassName("drag2")[0];

      drag.style.top = e.pageY - prepro_menu_y + "px";
      drag.style.left = e.pageX - prepro_menu_x + "px";

      //マウスボタンが離されたとき
      drag.addEventListener("mouseup", mouseup, false);
      document.body.addEventListener("mouseleave", mouseup, false);

  }

  //マウスボタンが上がったとき
  function mouseup(e) {

      // bodyのムーブベントハンドラの消去
      document.body.removeEventListener("mousemove", mousemove, false);

      var drag = document.getElementsByClassName("drag2")[0];
      if(drag != undefined){
        //クラス.drag も消す
        drag.removeEventListener("mouseup", mouseup, false);
        drag.classList.remove("drag2");
      }
  }

})()