/******************************************************************************/
/* Copyright (c) NICT. All rights reserved.                                   */
/* See License.txt for the license information.                               */
/******************************************************************************/

// *******************************************************
// 各種共通変数（固定、可変あり）
// *******************************************************
let wgapp = {};
wgapp.val = 1;    
accessToken = ""
let url_select_layerids = {} // URLで選択レイヤのsource_idと透明度のJson{source_id:{opacity:値}}}

let jinryu_exist_date = "" // 人流データが存在している年月日

let geojson_data = {}           // レイヤごとのgeojson
let mf_json_time_geojsons = {}; // mf_jsonのレイヤごとのgeojson
let date_int_list = {};       ; // レイヤの時刻キー
let mf_json_closest_date = null; // 表示している一番近い時刻


// 前処理の定義と一時保存変数
const API_URL = "https://tb-gis-web.jgn-x.jp/api"
//const API_URL = "http://localhost:5000"
const self_prepro_source_ids = ['layer_amedas', 'layer_garbagetruck', 'layer_garbagetruck_trajectory'];
const self_api_names = {'layer_amedas':"t_preprocessing_amedas_data",'layer_garbagetruck':"t_preprocessing_garbagetruck_data",'layer_garbagetruck_trajectory':"t_preprocessing_garbagetruck_data"};  // API名
let prepro_response_geojsons = {'layer_amedas':{}, 'layer_garbagetruck':{}};     // 前処理の時刻ごとのgeojson
let prepro_date_int_list =  {'layer_amedas':[], 'layer_garbagetruck':[]};         // 前処理の時刻キー

// 選択時刻
let g_current_p = Date.now();


// *******************************************************
// 基盤地図
// *******************************************************
const base_map_inputs = document.getElementById('base_menu').getElementsByTagName('input');

// *******************************************************
// 最初のmapbox定義
// center：東京駅付近
// *******************************************************
mapboxgl.accessToken = mapbox_accessToken;
wgapp.map = new mapboxgl.Map({
   container: "map",
   style: './json/base_map/' + base_map_inputs[1].id + '.json', 
   center: [139.76652062736588, 35.68129033294029],
   zoom: 12,
   maxZoom: 13.99,
   transformRequest: (url, resourceType) => {
          if (resourceType === 'Tile') {
              return {
                      url: url,
                      headers: {
                          'Authorization': 'Bearer ' + accessToken }
              }
          }
      }
 })
 
//  3Dグラフの可変情報
 wgapp.bargraph = {};
 wgapp.bargraph.radiusSize = 3;
 wgapp.bargraph.elevationScale = 1;

// 基盤地図選択変更イベントを定義
for (const input of base_map_inputs) {
  input.onclick = (layer) => {
    wgapp.map.once("styledata", changeStyledata);
    wgapp.map.setStyle('./json/base_map/' + layer.target.id + '.json?date=20220221_5');
  }
}

// 基盤地図選択変更の実処理
function changeStyledata(){
  // jsonファイルを読み込み、Layerを表示する
  make_layers();

  // 前処理データのラベル表示
  const selectedLayerIds = getLayerIds();
  if (selectedLayerIds.includes(self_prepro_source_ids[0])) {
    setAmedasTextLayer();
  }
  if (selectedLayerIds.includes(self_prepro_source_ids[1])) {
    setMovingObjectTextLayer("speed");
  }
  
  // 時系列データは該当時刻のデータ表示
  updatePreproJsonLayer(formatDate(g_current_p, 'YYYYMMDDhhmmss'), true); // make_layersしているので新規再作成

  // 手動でアップロードしていたMF-JSON（クリアしているので新規）
  updateMfJsonLayer(g_current_p.getTime(), true)

}

let layers_info = null;
 
wgapp.map.on("load", () => {
  // Geojsonを読み込む
  readGeoJSON();

  // jsonファイルを読み込み、Layerを表示する
  make_layers();

  // GeoJsonアップロードエリアの表示
  appendHTMLgeojson_upload();

  // コントローラーの位置を設定
   wgapp.map.addControl(new mapboxgl.ScaleControl(), 'top-right');
   wgapp.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
   wgapp.map.addControl(new mapboxgl.GeolocateControl({
     positionOptions: {enableHighAccuracy: false},
     trackUserLocation: true,
     showUserLocation: true
  }), 'top-right');


  // 人口の設定ボタン
  $('#radius > #count').on('change', function () {
    wgapp.bargraph.radiusSize = parseInt(this.value);
    bargraphUpdate(wgapp.bargraph_data);
  });
  $('#elevation > #count').on('change', function () {
    wgapp.bargraph.elevationScale = Number(this.value);
    bargraphUpdate(wgapp.bargraph_data);
  });
  $('#color_patern1').on('change', function () {
    const colorValue = this.value;
    $('#color_patern1').css('color', colorValue);
    wgapp.map.setPaintProperty('extrusion_population', 'fill-extrusion-color', colorValue);
  });
  $('#color_patern2').on('change', function () {
    const colorValue = this.value;
    $('#color_patern2').css('color', colorValue);
    wgapp.map.setPaintProperty('extrusion_households', 'fill-extrusion-color', colorValue);
  });
  $('#color_patern3').on('change', function () {
    const colorValue = this.value;
    $('#color_patern3').css('color', colorValue);
    wgapp.map.setPaintProperty('extrusion_housing', 'fill-extrusion-color', colorValue);
  });

  console.log("map load end")

})

// JSONファイルを解析して読み込む
async function readJSON(path){
    try{
      const response = await fetch(path+"?date=20230201_1");
      if (response.ok) {
        ret = await response.json()
        return ret;
      } else {
        console.log("HTTP-Error: " + response.status);
        return null;
      }
    } catch(err) {
      console.log(err);
      return null;
    }
}

// アメダスデータの読み込みフラグ (1:読み込み中, 2:キャッシュ(ファイルから読み込んだデータ）を新規描写)
let amedass_flg = 0;

// GeoJSONファイルを解析して読み込む
async function readGeoJSON(){
  console.log("readGeoJSON start")

  let selected_yyyymmdd = formatDate(g_current_p, 'YYYYMMDD');
  let selected_hhmi = formatDate(g_current_p, 'hhmm');

  bound = wgapp.map.getBounds();
  point_1 = bound["_ne"]["lng"] + "," + bound["_ne"]["lat"];
  point_2 = bound["_ne"]["lng"] + "," + bound["_sw"]["lat"];
  point_3 = bound["_sw"]["lng"] + "," + bound["_sw"]["lat"];
  point_4 = bound["_sw"]["lng"] + "," + bound["_ne"]["lat"];

  let selectedLayerIds = getLayerIds();

  // URLから選択された場合を考慮
  if(selectedLayerIds == null){
    if(url_select_layerids == undefined || url_select_layerids == null){
      return null;
    }
    selectedLayerIds = Object.keys(url_select_layerids);
  }

  // *****************************************************************
  // 人流データ
  // *****************************************************************
  if (selectedLayerIds.includes("layer_jinryu")) {
    // 存在する年月日を取得
    if(jinryu_exist_date == ""){
      path_get_date = "https://tb-gis-web.jgn-x.jp/api/t_people_exist_date";

      try{
        const response = await fetch(path_get_date);
        if (response.ok) {
          const res =  await response.json();
          jinryu_exist_date = ""
          Object.keys(res).forEach(function(date){
            jinryu_exist_date += date.substring(0,4) + "年" 
                + date.substring(4,6) + "月" + date.substring(6,8) + "日 ：" 
                + res[date] + "<BR>"
          });

          // カラーバーに追記
          updateLegend();
        } else {
          console.log("HTTP-Error: " + response.status);
        }
      } catch(err) {
        console.log(err);
      }
  
    }

    path = "https://tb-gis-web.jgn-x.jp/api/t_people_flow_data?point_1=" 
		  + point_1 + "&point_2=" + point_2 + "&point_3=" + point_3 + "&point_4=" + point_4 + "&currentDate=" + selected_yyyymmdd + selected_hhmi;
    try{
      const response = await fetch(path);
      if (response.ok) {
        geojson_data["layer_jinryu"] =  await response.json();
        setGeojsonLayerSource("layer_jinryu_L1","layer_jinryu");
      } else {
        console.log("HTTP-Error: " + response.status);
        return null;
      }
    } catch(err) {
      console.log(err);
      return null;
    }
  }

  // *****************************************************************
  // アメダスデータ
  // *****************************************************************
  if (selectedLayerIds.includes(self_prepro_source_ids[0])) {

    if (amedass_flg == 1 ){
      // なにもしない（読み込み中 or キャッシュ利用中）


    }else if (amedass_flg == 0 ){
      // 該当する領域、日時のポイントデータを取得
      console.log("<><><> call api t_amedas_data <><><> ")

      path = "https://tb-gis-web.jgn-x.jp/api/t_amedas_data?point_1=" 
      + point_1 + "&point_2=" + point_2 + "&point_3=" + point_3 + "&point_4=" + point_4 + "&currentDate=" + selected_yyyymmdd + selected_hhmi;

      try{
        amedass_flg = 1; // 読み込み中であることを明記

        const response = await fetch(path);
        if (response.ok) {
          geojson_data[self_prepro_source_ids[0]] =  await response.json();
          generateAmedasFeatures(); // @see moving_feature.js
          setGeojsonLayerSource(self_prepro_source_ids[0] + "_L1", self_prepro_source_ids[0]);
          amedass_flg = 0;

        } else {
          console.log("HTTP-Error: " + response.status);
          amedass_flg = 0;
          return null;
        }

      } catch(err) {
        console.log(err);
        amedass_flg = 0;
        return null;
      }
    }

  }

  console.log("readGeoJSON end")
}


/**
 * Layer情報をJSONから取得する
**/
async function get_layer_info() {
  ret_array = []; // 初期化
  json = null;  
  for(const l_key in const_layer_jsons){
    if (const_layer_jsons[l_key].path =='vectortile') {
      json = await readJSON(vectortile_data_path + l_key + '/latest/style.json');
      ret_array.push([l_key, json,const_layer_jsons[l_key].path]);
    } else if (const_layer_jsons[l_key].path =='etc_1') {
      json = await readJSON(etc_data_path + l_key + '.json');
      ret_array.push([l_key, json,const_layer_jsons[l_key].path]);
    } else if (const_layer_jsons[l_key].path =='etc_2') {
      json = await readJSON(etc_data_path + l_key + '.json');
      ret_array.push([l_key, json,const_layer_jsons[l_key].path]);
    } else if (const_layer_jsons[l_key].path =='geojson') {
      json = await readJSON(etc_data_path + l_key + '.json');
      ret_array.push([l_key, json,const_layer_jsons[l_key].path]);
    } else if (const_layer_jsons[l_key].path =='geojson2') {
      json = await readJSON(etc_data_path + l_key + '.json');
      ret_array.push([l_key, json,const_layer_jsons[l_key].path]);
    }  else if (const_layer_jsons[l_key].path =='pointcloud') {
      ret_array.push([l_key, "",const_layer_jsons[l_key].path]);
    }  else if (const_layer_jsons[l_key].path =='polygoncloud') {
        ret_array.push([l_key, "",const_layer_jsons[l_key].path]);
    }  else if (const_layer_jsons[l_key].path =='poppointcloud') {
        ret_array.push([l_key, "",const_layer_jsons[l_key].path]);
    }
    
  }

  return ret_array;
}

let etc_2_tiles = {}


/**
 * layer_confで定義した情報におけるレイヤを作成する
 */
async function make_layers() {
  console.log("----------make_layers start")

  // 人口などのレイヤ
  addPopulationLayer();

  fflag = 0;
  if (layers_info == null){
    layers_info = await get_layer_info();
  } else {
    fflag = 1;
  }

  // 各レイヤを追加
  for(m_info of layers_info){
    const source_id = m_info[0];
    const path = m_info[2];

    try{

      // **********************************************
      // ソースを追加
      if (path == "vectortile") {
        wgapp.map.addSource(source_id, {
          type: "vector",
          tiles: [server_url + "api/data/vectortile/" + source_id + "/latest/{z}/{x}/{y}.pbf"],
        })
      } else if (path == "etc_1") {
        wgapp.map.addSource(source_id, {
          type: m_info[1].sources[source_id].type,
          tiles: m_info[1].sources[source_id].tiles,
        })
      } else if (path == "etc_2") {
        etc_2_tiles[source_id] = m_info[1].sources[source_id].tiles;
        etc_2_tile = get_etc_2_tile(source_id);
        wgapp.map.addSource(source_id, {
          type: m_info[1].sources[source_id].type,
          tiles: [etc_2_tile],
        })
      } else if (path == "geojson") {
        // dataもセットする
        if(geojson_data[source_id] != undefined){
          wgapp.map.addSource(source_id, {
            type: "geojson",
            data: geojson_data[source_id],
          })
        }else{
          wgapp.map.addSource(source_id, {
            type: "geojson",
            data: "",
          })
        }
      }  else if (path == "geojson2") {
        // jsonに記載されている内容をそのまま登録
        // 軌跡のgradientについては、@see https://docs.mapbox.com/mapbox-gl-js/example/line-gradient/
        // console.log("m_info[1].sources", m_info[1].sources[source_id])
        wgapp.map.addSource(source_id, m_info[1].sources[source_id])
      }
    } catch(err) {
      console.log(err);
    }

    // **********************************************
    // 選択されているレイヤを再追加

    const menu_box = document.getElementById("menu-box" + source_id);       

    if (const_layer_jsons[source_id]["type"] == "pointcloud") {
      if (source_id in url_select_layerids){
        if (wgapp.map.getLayer(layerId)) {
          wgapp.map.removeLayer(layerId);
        }
        addPointCloudLayer(wgapp.map, 'point_cloud', './data/sample.csv');
      }
    } else if(const_layer_jsons[source_id]["type"] == "polygoncloud") {
      if (source_id in url_select_layerids){
        if (wgapp.map.getLayer(layerId)) {
          wgapp.map.removeLayer(layerId);
        }
        addPlaneGroupLayer(wgapp.map, 'polygon_cloud', './data/sample.json');
      }
    } else if(const_layer_jsons[source_id]["type"] == "poppointcloud") {
      // const layers = layer_jsons[source_id]["layer"];
      // for(layer of layers){
      //   if (menu_box != null){
      //     if(menu_box.style == "display: flex;" || menu_box.style.cssText == "display: flex;"){
      //       // 選択済みの場合
      //       wgapp.map.setLayoutProperty(layer, 'visibility', 'visible');
      //     }else{
      //       wgapp.map.setLayoutProperty(layer, 'visibility', 'none');
      //     }
      //   }else{
      //     console.log("menu_box is null.")
      //     if (source_id in url_select_layerids){
      //       // URLパラメータでレイヤ表示対象であればvisible
      //       wgapp.map.setLayoutProperty(layer, 'visibility', 'visible');
      //     }else{
      //       wgapp.map.setLayoutProperty(layer, 'visibility', 'none');
      //     }
      //   }
      // }

    } else {
      if (m_info[1] != null){
        const layers = m_info[1].layers;
        for(layer of layers){
          if (layer.id == "background") {
	        	continue;
          }

          if (wgapp.map.getSource(source_id)) {
            if (fflag == 0) {
              layer.id = source_id + '_' + layer.id;
            }
            const_layer_jsons[source_id]["layer"].push(layer.id);
            layer.source = source_id;
            wgapp.map.addLayer(layer)

            if (menu_box != null){
              if(menu_box.style == "display: flex;" || menu_box.style.cssText == "display: flex;"){
                // 選択済みの場合
                wgapp.map.setLayoutProperty(layer.id, 'visibility', 'visible');
              }else{
                wgapp.map.setLayoutProperty(layer.id, 'visibility', 'none');
              }
    
            }else{
              if (source_id in url_select_layerids){
                // URLパラメータでレイヤ表示対象であればvisible
                wgapp.map.setLayoutProperty(layer.id, 'visibility', 'visible');
              }else{
                wgapp.map.setLayoutProperty(layer.id, 'visibility', 'none');
              }
            }
          }
        }

        if (menu_box != null){
          if(menu_box.style == "display: flex;" || menu_box.style.cssText == "display: flex;"){
            const rangeSlider = document.getElementById(source_id);
            setOpacity(source_id, rangeSlider.value/10)
          }
        }else{
          if (source_id in url_select_layerids){
            setOpacity(source_id, Number(url_select_layerids[source_id]["opacity"]));
          }else{
            // 初期
            setOpacity(source_id, 0.6);
          }
        }

      }
    }
  }

  console.log("----------make_layers end")

}

/**
  * Layer選択メニュー(side-menu)を作成
  * ・・・選択時と未選択時の両方のdivを作成しておき、style="display:xxx"で、活性・非活性で制御する。
  * 
  * mapがidle状態になる前に実行
*/
wgapp.map.on('idle', () => {
  console.log("####idle start");
  // Layer単位で生成
  for(let const_key in const_layer_jsons){
    _info = const_layer_jsons[const_key]
    const id = const_key;
    // すでに作成されていればすべてスキップ
    if (document.getElementById(id)) {
      // continue;
      return;
    }
    // 透明度スライダーを生成
    // ******************************************
    // 活性用
    const range_slider = document.createElement('input');
    range_slider.id = id;
    range_slider.min='1';
    range_slider.max='10';
    range_slider.step='1';
    range_slider.type  = "range";
    range_slider.layerType = _info.type;
    range_slider.className = 'slider-range';

    if (id in url_select_layerids){
      range_slider.value =  Number(url_select_layerids[id]["opacity"]) * 10 // メニュー値の設定だけ
    }
    // sourcr_type_list[id] = _info.type;

    const p_label = document.createElement('p');
    p_label.id ="p_label_" + id;
    p_label.className="turnBoxButton turnBoxButtonPrev dctrl_name";
    if(_info.name != undefined){
      p_label.textContent = _info.name;
    }else{
      p_label.textContent = id;
    }
    // スライダーを有効にするためラベルは無効
    p_label.style="pointer-events: none;";

    const col_right = document.createElement("div");
    col_right.className = "col-right";
    col_right.appendChild(range_slider);
    col_right.appendChild(p_label);

    const menu_box = document.createElement("div");
    menu_box.className = 'menu-box ctrl_enabled not_exclude';
    menu_box.id = "menu-box" + id;

    // URLに選択レイヤがある場合はここでstyleにセット
    // if (url_select_layerids.length != 0 && url_select_layerids.includes(id)){
    if (id in url_select_layerids){
      // 表示
      menu_box.style = "display: flex;";
    }else{
      // 非表示
      menu_box.style="display: none;";
    }
    //  menu_box.appendChild(col_left);
    menu_box.appendChild(col_right);

    // ******************************************
    // 非活性用 start(すべて作成が必要)
    const range_slider2 = document.createElement('input');
    range_slider2.id ="r2_" + id;

    const p_label2 = document.createElement('p'); 
    p_label2.id ="p_label_2" + id;
    p_label2.className="turnBoxButton dctrl_name off";
    if(_info.name != undefined){
      p_label2.textContent = _info.name;
    }else{
      p_label2.textContent = id;
    }
    const col_right2 = document.createElement("div");
    col_right2.className = "col-right";
    col_right2.appendChild(p_label2);

    const menu_box2 = document.createElement("div"); 
    menu_box2.className = 'menu-box ctrl_disabled';
    menu_box2.id = "menu-box2" + id;
    // if (url_select_layerids.length != 0 && url_select_layerids.includes(id)){
    if (id in url_select_layerids){
      // 表示
      menu_box2.style="display: none;";
    }else{
      // 非表示
      menu_box2.style="display: flex;";
    }
    menu_box2.appendChild(col_right2);
    // 非活性用 end 


    // ******************************************
    // tnBox
    const tnBox = document.createElement("div");
    tnBox.className="tnBox switch"
    tnBox.appendChild(menu_box2);
    tnBox.appendChild(menu_box);

    const datas = document.createElement("div");
    datas.id="data_" + id;
    // datas.layer_id = id;
    datas.className="data sortable";
    datas.appendChild(tnBox);
    group_list[_info.group].push(datas);

  } // for layers_info

  url_select_layerids = {} // パラメータを使用したのでクリア

  for (let k in group_list) {
    data_select_box = document.createElement('div');
    data_select_box.className = 'data_select_box';

    for (let d of group_list[k]) {
      data_select_box.appendChild(d);
    }
    // console.log("data_select_box firstChild", data_select_box.firstChild)

    side_menu = document.getElementById(k);
    side_menu.appendChild(data_select_box);
  }

  console.log("####idle end");

  /***********************************************************
  * JQuery処理
  ***********************************************************/
  $(function () {
    /**
     * データ選択ボタンのクリック間隔の閾値(ms) */
    const DCTRL_CLICK_INTERVAL = 200;

    // // 選択解除判定
    // let unselected = false;

    // 連続クリック防止用フラグ
    // turnBoxのアニメーションが終わった後でフラグをfalseにする必要があるため、
    // このフラグはクリック処理の後、setTimeoutで遅延させてからフラグをfalseにする
    let selectClicking = false;

    // 非表示->表示
    $('.data_select_box .ctrl_disabled').dblclick(function () {
       console.log('非表示から dblclick', selectClicking);
      if (selectClicking == false) {
        selectClicking = true;
        const source_id = this.id.replace("menu-box2","");
        const menu_box = document.getElementById("menu-box" + source_id);
        // 表示
        if (source_id == "point_cloud") {
          addPointCloudLayer(wgapp.map, 'point_cloud', './data/sample.csv');
          menu_box.style="display: flex;";
          this.style="display: none;";
        } else if (source_id == "pplygon_cloud") {
            addPointCloudLayer(wgapp.map, 'pplygon_cloud', './data/sample.json');
            menu_box.style="display: flex;";
            this.style="display: none;";
        } else {
            for (let l of const_layer_jsons[source_id]["layer"]) {
              wgapp.map.setLayoutProperty(l, 'visibility', 'visible');
              menu_box.style="display: flex;";
              this.style="display: none;";
              // 凡例も
              const legend = document.getElementById('lg_' + l);
              if(legend){
                  legend.className = 'legend';
              }

              // テキストレイヤも
              const l2 = l.replace("_L1", "_L2");
              if (wgapp.map.getLayer(l2)) {
                wgapp.map.setLayoutProperty(l2, 'visibility', 'visible');
              }
            }

            if (source_id == self_prepro_source_ids[0] || source_id == self_prepro_source_ids[1] || source_id == self_prepro_source_ids[2]){
              // 前処理データ関連の場合
              $("#prepro_controller").removeClass("hidden");
              // $('#view_type').children().remove(); // いったんすべて削除

              // 移前処理の場合、透過性を1(100%)にする
              if(source_id != self_prepro_source_ids[2]){
                setOpacity(source_id, 1.0);
                const rangeSlider = document.getElementById(source_id);
                rangeSlider.value = 10;
              }else{
                // 軌跡は別
                setOpacity(source_id, 0.3);
                const rangeSlider = document.getElementById(source_id);
                rangeSlider.value = 3;
              }

              // source_idが異なった場合（初回表示）
              if (source_id != $("#prepro_db_data_type").val()){
                // ファイル名と大きさ、選択肢を初期化
                let result_inner = document.getElementById('prepro_file_name');
                result_inner.innerHTML = "Geojsonアップロード(復元)";
                let fileinput = document.getElementById('prepro_fileinput');
                fileinput.value = "";                
                $('#feature_size').val(1.0);

                // カラムリスト作成など
                $('#col_name').children().remove(); // いったんすべて削除
                if (source_id == self_prepro_source_ids[0] ){
                  // アメダス
                  $('#col_name').append($('<option value="precipitation24h">24時間降雨量</option>'));
                  $('#col_name').append($('<option value="temp">気温</option>'));
                  $('#col_name').append($('<option value="snow">積雪深</option>'));
  
                  // 通常アメダスデータの取得はしない
                  amedass_flg = 1;
  
                }else{
                  // 移動体
                  $('#col_name').append($('<option value="speed">速度</option>'));
                  $('#col_name').append($('<option value="pm25">PM2.5</option>'));

                  // 移動体のいずれかのデータがなければ移動する
                  if (geojson_data[self_prepro_source_ids[1]] == undefined && geojson_data[self_prepro_source_ids[2]] == undefined){
                    wgapp.map.flyTo({
                      center: [137.07078, 35.131889],
                    });
                  }
                  
                }

              }

              // データタイプ(レイヤソースID)指定
              $("#prepro_db_data_type").val(source_id);

            }
    
            if(source_id == "bargraph_source"){
              $("#bargraph_controller").removeClass("hidden");
            }

        }

        layer_update("",g_current_p);

        setTimeout(function () {
                selectClicking = false;
        }, DCTRL_CLICK_INTERVAL);

      }
    });

    // 表示->非表示
    $('.data_select_box .ctrl_enabled').dblclick(function () {

      selectClicking = false;
      const source_id = this.id.replace("menu-box","");
      console.log('表示から dblclick', source_id);

      const menu_box2 = document.getElementById("menu-box2" + source_id);                      
      // 非表示
      if ((source_id == "point_cloud") || (source_id == "polygon_cloud")) {
        if (wgapp.map.getLayer(source_id)) {
          wgapp.map.removeLayer(source_id);
        }
        this.style="display: none;";
        menu_box2.style="display: flex;";
      } else {
        for (let l of const_layer_jsons[source_id]["layer"]) {
          wgapp.map.setLayoutProperty(l, 'visibility', 'none');
          this.style="display: none;";
          menu_box2.style="display: flex;";
          // 凡例も
          const legend = document.getElementById('lg_' + l);
          if(legend){
            legend.className = 'legend-disable';
          }

          // テキストレイヤも
          const l2 = l.replace("_L1", "_L2");
          if (wgapp.map.getLayer(l2)) {
            wgapp.map.setLayoutProperty(l2, 'visibility', 'none');
          }

	      }

        if (source_id == self_prepro_source_ids[0] || source_id == self_prepro_source_ids[1] || source_id == self_prepro_source_ids[2]){
          // 前処理データ関連の場合
          // 非表示
          $("#prepro_controller").addClass("hidden");
        }

        if(source_id == "bargraph_source"){
          $("#bargraph_controller").addClass("hidden");
        }

      }
      layer_update("",g_current_p);
    });

    /***********************************************************
    * スライダー変動による透明度の変更
    ***********************************************************/
     $('.data_select_box .ctrl_enabled').mouseup(function () {
      console.log("mouseup");
      const id = this.id.replace("menu-box","");
      const rangeSlider = document.getElementById(id);
      try{
        if(rangeSlider != undefined){
          setOpacity(id, rangeSlider.value/10);
        }
      } catch(err) {
          console.log(err);
      }
    });
  });
});


/***********************************************************
* 地図移動後のイベントハンドル
***********************************************************/
wgapp.map.on('moveend', () => {
  console.log("### moveend")

  readGeoJSON();

  // 前処理データも再描画（ズームで地物の大きさも変更するため常時必要）
  updatePreproJsonLayer(formatDate(g_current_p, 'YYYYMMDDhhmmss'), true);

});


/***********************************************************
* 現在時刻のデータにレイヤを更新
* @param fileName : fileName 画面キャプチャファイル名
* @param current_p : 現在時刻
***********************************************************/
function layer_update(fileName, current_p) {
  console.log("<><><> layer_update start");
  g_current_p = current_p;
  readGeoJSON();

  let selectedLayerIds = getLayerIds();

  // URLから選択された場合を考慮（まだLayerは生成されていない）
  if(selectedLayerIds == null){
    selectedLayerIds = Object.keys(url_select_layerids);
  }

  if (selectedLayerIds != null){
    // etc_2_tiles
    for (let key in etc_2_tiles) {
        tile = get_etc_2_tile(key);
        for (let l of const_layer_jsons[key]["layer"]) {
          if ( selectedLayerIds.includes(key)) {
            setLayerSource(l,const_layer_jsons[key]["type"],key,tile);
          }
        }
    }

    // 点群
    if (selectedLayerIds.includes("point_cloud")) {
      updateBargraph();
    }
    // 面群
    if (selectedLayerIds.includes("polygon_cloud")) {
      updatePlaneGroupLayer();
    }
    // 人口
    if (selectedLayerIds.includes("bargraph_source")) {
      updatePopulationLayer();
      // 設定も表示
      $("#bargraph_controller").removeClass("hidden");
    }

    // アメダスデータ or 移動体データ
    if (selectedLayerIds.includes(self_prepro_source_ids[0]) || selectedLayerIds.includes(self_prepro_source_ids[1]) || selectedLayerIds.includes(self_prepro_source_ids[2])) {
      if ($("#start_date").val() == ""){

        // 初期（開始日時、終了日時を設定）
        const date1 = new Date(g_current_p.getTime());
        const start_time= formatDate(new Date(date1.setHours(date1.getHours() - 12)), 'YYYY-MM-DDThh:mm');
        const end_time = formatDate(g_current_p, 'YYYY-MM-DDThh:mm');
        $("#start_date").val(start_time);
        $("#end_date").val(end_time);

      }else{
        // 該当日時にデータ更新
        updatePreproJsonLayer(formatDate(g_current_p, 'YYYYMMDDhhmmss'), false)
      }
    }
  }

  // MF-JSON
  updateMfJsonLayer(g_current_p.getTime(), false)

  // 画面キャプチャ実行
  if(fileName != undefined && fileName != ""){
    getMapCapture2(fileName)
  }

  // 凡例生成
  updateLegend();

  console.log("<><><> layer_update end")

}

function setLayerSource (layerId, ltype, sourceLayer,tile) {
    console.log("setLayerSource start");
    const oldLayers = wgapp.map.getStyle().layers;
    const layerIndex = oldLayers.findIndex(l => l.id === layerId);
    const layerDef = oldLayers[layerIndex];
    const before = oldLayers[layerIndex + 1] && oldLayers[layerIndex + 1].id;
    
    try{
      wgapp.map.removeLayer(layerId);
      wgapp.map.removeSource( sourceLayer );
      wgapp.map.addSource(
        sourceLayer, {
          type : ltype,
          tiles : [tile]
        }
      );
      wgapp.map.addLayer(layerDef, before);
    } catch(err) {
      console.log(err);
    }

    // 透明度を設定
    const rangeSlider = document.getElementById(sourceLayer);
    if(rangeSlider == false){
      // まだメニュー設定でなければデフォルト値で透明度設定
      setOpacity(sourceLayer, 0.6)
    }else{
      setOpacity(sourceLayer, rangeSlider.value/10)
    }
    console.log("setLayerSource end");
  }

  /**
   * 指定したidのレイヤを再度追加する
   * ※いったん追加されていることが前提
   * @param {*} layer_id 
   * @param {*} source_id 
   */
function setGeojsonLayerSource (layer_id, source_id) {
    console.log("setGeojsonLayerSource start")

    // 追加するレイヤのスタイルを取得
    const _layers = wgapp.map.getStyle().layers;
    const layerIndex = _layers.findIndex(l => l.id === layer_id);
    const layerDef = _layers[layerIndex];

    // 追加するレイヤの位置を設定するためのid
    const before_layerid = _layers[layerIndex + 1] && _layers[layerIndex + 1].id;

    try{
      
      // 常時いったん削除してから追加
      if (wgapp.map.getSource(source_id)) {
        if (wgapp.map.getLayer(layer_id)) {
          wgapp.map.removeLayer(layer_id);
        }
        if (wgapp.map.getLayer(source_id + "_L2")) {
          wgapp.map.removeLayer(source_id + "_L2");
        }
        wgapp.map.removeSource( source_id );
      }

      wgapp.map.addSource(
        source_id, {
          type : "geojson",
          data : geojson_data[source_id]
        }
      );

      if(layerDef != null){
          wgapp.map.addLayer(layerDef, before_layerid);
      }

    } catch(err) {
      console.log(err);
    }

    console.log("setGeojsonLayerSource end")
}


function get_etc_2_tile(source_id) {
    let selected_yyyymmdd = formatDate(g_current_p, 'YYYYMMDD');
    let selected_hhmi = formatDate(g_current_p, 'hhmm');
//    pl = parent.location
//  if (pl.search.length > 1){
//    var objGetQueryString = getQueryString(pl.search);
//    if(objGetQueryString.dt != undefined){
//      selected_yyyymmdd = objGetQueryString.dt.substr(0,8)
//    }
//    if(objGetQueryString.dt != undefined){
//      selected_hhmi = objGetQueryString.dt.substr(8,4)
//    }
//  }
  selected_yyyymmdd_str = selected_yyyymmdd.toString();
 
    date_keys = Object.keys($History['data']);

    let history_index = $History["currentData"];
    let pre_yyyymmdd = '19000101';
    for (let index in date_keys){
      const tmp_yyyymmdd = $History['data'][index]['key'];
      if (selected_yyyymmdd >= pre_yyyymmdd && selected_yyyymmdd < tmp_yyyymmdd){
        history_index = index-1;
        break;
      }
      pre_yyyymmdd = tmp_yyyymmdd;
    }

  let selected_yyyymmdd_utc = formatDateUTC(g_current_p, 'YYYYMMDD');
  let selected_hhmi_utc = formatDateUTC(g_current_p, 'hhmm');
  const date_path = selected_yyyymmdd_utc.substring(0,4) + "/" + selected_yyyymmdd_utc.substring(4,6) + "/" + selected_yyyymmdd_utc.substring(6,8);
 
  tile = etc_2_tiles[source_id][0];
  tile = tile.replace('{yyyy}/{mm}/{dd}', date_path);
  tile = tile.replace('{yyyymmdd}/{hhmm}', selected_yyyymmdd_utc + "/" + selected_hhmi_utc.substring(0,3)+"0");
  tile = tile.replace('{hh}/{mi}', selected_hhmi_utc.substring(0,2) + "/" + selected_hhmi_utc.substring(2,3)+"0");

  tile = tile.replace('{yyyymmdd}', $History['data'][history_index]['key']);
  return tile;
}

$(function () {
    $('.ac-parent').on('click', function () {
    $(this).next().slideToggle();
  });
});

function addPointCloudLayer(map, layerId, filename){
  d3.csv(filename).then(function(data) {
    pointCloudLayer = createPointCloudLayer(layerId, data);
    map.addLayer(pointCloudLayer);
  }).catch(function(error){
    console.log(error);
    console.log("error : readCsv " + filename);
  });
}

function createPointCloudLayer(layerId, pointData){
  const { MapboxLayer, PointCloudLayer } = deck;

  return new MapboxLayer({
    id: layerId,
    type: PointCloudLayer,
    data: pointData,
    getPosition: d => [Number(d.lng), Number(d.lat), Number(d.val)],
    getColor: d => [255, 0, 0],
    sizeUnits: 'meters',
    pointSize: 10,
    opacity: 1
  });
}

function updateBargraph(){
 
  let selected_yyyymmdd = formatDate(g_current_p, 'YYYYMMDD');
  let selected_hh = formatDate(g_current_p, 'hh');
 
  formatDt = selected_yyyymmdd + selected_hh + "00";
  const layerId = 'point_cloud';
  if (wgapp.map.getLayer(layerId)) {
    wgapp.map.removeLayer(layerId);
  }
  addPointCloudLayer(wgapp.map, layerId, './data/' + formatDt + '.csv');
}

function addPlaneGroupLayer(map, layerId, filename){
    d3.json(filename).then(function(data) {
      planeGroupLayer = createPlaneGroupLayer(layerId, data);
      map.addLayer(planeGroupLayer);
    }).catch(function(error){
      console.log(error);
    });
}

function createPlaneGroupLayer(layerId, planeData){
    const layer = new deck.MapboxLayer({
        id: layerId,
        type: deck.PolygonLayer,
        data: planeData,
        getPolygon: d => d.contour,
        getElevation: d => 0,
        getFillColor: d => convertColor(d.value),
        getLineColor: [255, 0, 0],
        opacity: 0.5,
    });

    return layer;
}

function updatePlaneGroupLayer(){
    let selected_yyyymmdd = formatDate(g_current_p, 'YYYYMMDD');
    let selected_hh = formatDate(g_current_p, 'hh');
   
    formatDt = selected_yyyymmdd + selected_hh + "00";

    const layerId = "polygon_cloud";
    if (wgapp.map.getLayer(layerId)) {
        wgapp.map.removeLayer(layerId);
    }
    addPlaneGroupLayer(wgapp.map, layerId, './data/' + formatDt + '.json');
}

function convertColor(val){
    let r = (parseInt(Math.min(val, 16 * 16* 16 - 1) / (16 * 16))) * 16;
    let g = (parseInt(val / 16) % 16) * 16;
    let b = (val % 16) * 16;
    return [r, g, b];
}

// /**
//  * 人口レイヤのデータを読み込んで、GeoJsonを生成して共通変数(wgapp.bargraph_data)に設定する
//  */
// function getPoplationGeoJson() {
//     let loadFiles = [
//         d3.csv("../../storage/data/download/demographics/sample.csv")
//       ];
    
//       Promise.all(loadFiles).then(function (csv) {
//         wgapp.bargraph_data = {
//           "type": "FeatureCollection",
//           "features": csv[0].map(function(d) {
//             return {
//               type: "Feature",
//               properties: {
//                 name: d.name,
//                 population: d.population * 0.01,
//                 households: d.households * 0.01,
//                 housing: d.housing * 0.01
//               },
//               geometry: {
//                 type: "Point",
//                 coordinates: [
//                   parseFloat(d.lon),
//                   parseFloat(d.lat)
//                 ]
//               }
//             }
//           })
//         }
//         // console.log("wgapp.bargraph_data", wgapp.bargraph_data);
      
//       }); 
// }

/**
 * 3Dバーグラフの生成
 * @param {} bargraph_data 
 */    
function bargraphUpdate(bargraph_data) {

  let data = {
    "type": "FeatureCollection",
    "features": []
  };
  // let radius_size = 3;
  let radius_size = wgapp.bargraph.radiusSize;

  bargraph_data.features.forEach(function (object, i) {

    const point = object.geometry.coordinates

    let xy = wgapp.map.project(point);
    xy.x += radius_size;

    let lnglat = wgapp.map.unproject(xy);
    lnglat = turf.point([lnglat.lng, lnglat.lat]);

    const radius = turf.distance(point, lnglat, {
      units: 'meters'
    }) + 0.00000001;

    // object.properties.population = object.properties.population * 0.01;
    // object.properties.households = object.properties.households * 0.01;
    // object.properties.housing = object.properties.housing * 0.01;
    // 実数値の0.01倍は取得時点で処理済み
    // 指定した高さ倍率(elevationScale)を追加
    object.properties.height_population = object.properties.population * wgapp.bargraph.elevationScale;
    object.properties.height_households = object.properties.households * wgapp.bargraph.elevationScale;
    object.properties.height_housing = object.properties.housing * wgapp.bargraph.elevationScale;
    object.properties.base = 0;
    object.properties.index = i;

    const options = {
      steps: 16,
      units: 'meters',
      properties: object.properties
    };

    const feature = turf.circle(point, radius, options);
    feature.id = i;

    data.features.push(feature);
  })

  wgapp.map.getSource('bargraph_source').setData(data);
}


/**
 * 人口（市区町村・複数年）レイヤの作成と追加
 */
function addPopulationLayer(){
    console.log("addPopulationLayer start")

    // getPoplationGeoJson()
    const source_id = 'bargraph_source';

    // 下記で読み込んでいるがサンプルを利用して追加させる
    d3.csv("../../storage/data/download/demographics/sample.csv").then(function(data) {
      wgapp.map.addSource(source_id, {
        "type": "geojson",
        "data": {
          type: 'FeatureCollection',
          features: []
        }
      });

      const color_patern1 = document.getElementById("color_patern1") != undefined ?  document.getElementById("color_patern1").value : 'blue';
      wgapp.map.addLayer({
        'id': 'extrusion_population',
        'type': 'fill-extrusion',
        'source': source_id,
        'paint': {
          'fill-extrusion-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            color_patern1,
            color_patern1
          ],
          'fill-extrusion-height': ['get', 'height_population'],
          'fill-extrusion-base': ['get', 'base'],
          // 'fill-extrusion-opacity': 0.6
        }
      });
      // wgapp.map.setLayoutProperty('extrusion_population', 'visibility', 'none');

      const color_patern2 = document.getElementById("color_patern2") != undefined ?  document.getElementById("color_patern2").value : 'red';
      wgapp.map.addLayer({
        'id': 'extrusion_households',
        'type': 'fill-extrusion',
        'source': source_id,
        'paint': {
          'fill-extrusion-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            color_patern2,
            color_patern2
          ],
          'fill-extrusion-height': ['get', 'height_households'],
          'fill-extrusion-base': ['get', 'base'],
          'fill-extrusion-translate': [10,10],
          // 'fill-extrusion-opacity': 0.6
        }
      });
      // wgapp.map.setLayoutProperty('extrusion_households', 'visibility', 'none');

      const color_patern3 = document.getElementById("color_patern3") != undefined ?  document.getElementById("color_patern3").value : 'yellow';
      wgapp.map.addLayer({
        'id': 'extrusion_housing',
        'type': 'fill-extrusion',
        'source': source_id,
        'paint': {
          'fill-extrusion-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            color_patern3,
            color_patern3
          ],
          'fill-extrusion-height': ['get', 'height_housing'],
          'fill-extrusion-base': ['get', 'base'],
          'fill-extrusion-translate': [-10,-10],
          // 'fill-extrusion-opacity': 0.6
        }
      });
      // wgapp.map.setLayoutProperty('extrusion_housing', 'visibility', 'none');
    
      // let hoveredStateId = null;
      const menu_box = document.getElementById("menu-box" + source_id);
      bargraphlayers = ["extrusion_population","extrusion_households","extrusion_housing"];
      for (let id of bargraphlayers) {
        // visibleの設定も個別でここで実施
        if (menu_box != null){
          if(menu_box.style == "display: flex;" || menu_box.style.cssText == "display: flex;"){
            // 選択済みの場合
            wgapp.map.setLayoutProperty(id, 'visibility', 'visible');
          }else{
            wgapp.map.setLayoutProperty(id, 'visibility', 'none');
          }
        }else{
          if (source_id in url_select_layerids){
            // URLパラメータでレイヤ表示対象であればvisible
            wgapp.map.setLayoutProperty(id, 'visibility', 'visible');
          }else{
            wgapp.map.setLayoutProperty(id, 'visibility', 'none');
          }
        }    

        // When a click event occurs on a feature in the places layer, open a popup at the
        // location of the feature, with description HTML from its properties.
        wgapp.map.on('click', id, function(e) {
          const dl = document.createElement("dl");
          const prop = e.features[0].properties;
          vname = prop.name;
          html = "";
          html = "<b>" + prop.name + "</b><br/><span>人口:" + (prop.population * 100).toLocaleString() + "</span>"
          html += "<br/><span>世帯:" + (prop.households * 100).toLocaleString() + "</span>"
          html += "<br/><span>住宅数:" + (prop.housing * 100).toLocaleString() + "</span></div>"
    
          new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(wgapp.map);
        });
    
        // Change the cursor to a pointer when the mouse is over the places layer.
        wgapp.map.on('mouseenter', id, function() {
          wgapp.map.getCanvas().style.cursor = 'pointer';
        });
    
      }
    
      // 実際の日付に該当するものに更新
      updatePopulationLayer();

      // 透明度を設定
      if (menu_box != null){
        if(menu_box.style == "display: flex;" || menu_box.style.cssText == "display: flex;"){
          const rangeSlider = document.getElementById(source_id);
          setOpacity(source_id, rangeSlider.value/10)
        }
      }else{
        if (source_id in url_select_layerids){
          setOpacity(source_id, Number(url_select_layerids[source_id]["opacity"]));
        }else{
          // 初期
          setOpacity(source_id, 0.6);
        }

      }

      console.log("addPopulationLayer end")
  
    }).catch(function(error){
      console.log(error);
      // console.log("error : readCsv " + filename);
    });
}


/**
 * 人口レイヤの更新
 */
function updatePopulationLayer(){
    let selected_yyyy = formatDate(g_current_p, 'YYYY');

    if (selected_yyyy >= 2018) {selected_yyyy = 2018} 
    else if (selected_yyyy < 2018 && selected_yyyy >= 2013) {selected_yyyy = 2013} 
    else if (selected_yyyy < 2013 && selected_yyyy >= 2008) {selected_yyyy = 2008} 
    else if (selected_yyyy < 2008 && selected_yyyy >= 2003) {selected_yyyy = 2003} 
    else if (selected_yyyy < 2003 ) {selected_yyyy = 1998} 

    Promise.all([d3.csv("../../storage/data/download/demographics/demographics_" + selected_yyyy + ".csv")]).then(function (csv) {
        wgapp.bargraph_data = {
          "type": "FeatureCollection",
          "features": csv[0].map(function(d) {
              // console.log(d)
            return {
              type: "Feature",
              properties: {
                name: d.name,
                population: d.population * 0.01,
                households: d.households * 0.01,
                housing: d.housing * 0.01
              },
              geometry: {
                type: "Point",
                coordinates: [
                  parseFloat(d.lon),
                  parseFloat(d.lat)
                ]
              }
            }
          })
        }
        // console.log(wgapp.bargraph_data);
        bargraphUpdate(wgapp.bargraph_data);
      });
}

// 親htmlから基盤地図を設定（変更）する関数
function setBaseMap(id){
  if(id == null){
    return
  }

  // ラジオボタンを変更
  for(const input of base_map_inputs){
    if (id == input.id){
      input.checked = true;
    }else{
      input.checked = false;
    }
  }
  wgapp.map.setStyle('./json/base_map/' + id + '.json');
}

// 選択している基盤地図のidを取得
function getBaseMapInfo(){
  for(const input of base_map_inputs){
    if (input.checked){
      return input.id;
    }
  }
}

// レイヤを選択状態にする（ためのIDリストに追加）
// layerIds : レイヤIDと透明度（:区切り）の配列
function setLayerVisible(layerIds){
  url_select_layerids = {} // 初期化
  for (let layer of layerIds){
    // url_select_layerids.push(layerId)
    const key = layer.split(":")[0];
    const value = layer.split(":")[1];
    url_select_layerids[key] = {"opacity": value}
  }
}

// 選択しているレイヤのidリストを取得
function getLayerIds(){
  if(layers_info == null){
    // まだ選択肢が生成されていない
    return null;
  }

  const ret_ids = [];
  for(m_info of layers_info){
    const source_id = m_info[0];
    const menu_box = document.getElementById("menu-box" + source_id);

    if(menu_box.style == "display: flex;" || menu_box.style.cssText == "display: flex;"){
      // 選択済みの場合
      ret_ids.push(source_id);
    }
  }
  return ret_ids
}

// 選択しているレイヤのidと透明度のリストを取得
function getLayerIdsWithOpacity(){
  if(layers_info == null){
    // まだ選択肢が生成されていない
    return null;
  }

  const ret_ids = [];
  for(m_info of layers_info){
    const source_id = m_info[0];
    const menu_box = document.getElementById("menu-box" + source_id);
    if(menu_box.style == "display: flex;" || menu_box.style.cssText == "display: flex;"){
      // 選択済みの場合(透明度も渡す)
      const rangeSlider = document.getElementById(source_id);      
      ret_ids.push(source_id + ":" + String(rangeSlider.value/10));
    }
  }
  return ret_ids
}

// 親htmlから呼び出すためのmap位置情報設定関数
function setCenterZoom(lng, lat, zoom_level, bearing, pitch) {
  if(!wgapp.map || wgapp.map == undefined) {
    return;
  }  

  if (lng != null && lat != null){
    wgapp.map.setCenter([lng, lat])
  }
  if(zoom_level && zoom_level != undefined){
    wgapp.map.setZoom(zoom_level)
  }

  if(bearing && bearing != undefined){
    wgapp.map.setBearing(bearing)
  }

  if(pitch  && pitch != undefined){
    wgapp.map.setPitch(pitch)
  }
}

// 親htmlから呼び出すためのmap位置情報取得関数
function getCenter(){
  return wgapp.map.getCenter();
}
function getZoom(){
  return wgapp.map.getZoom();
}
function getBearing(){
  return wgapp.map.getBearing();
}
function getPitch(){
  return wgapp.map.getPitch();
}

// DisplayCapture
function startMapCapture(fileName, pCallback){
  return startDisplayCapture(fileName, pCallback);
}

function singleMapCapture(fileName){
  singleCapture(fileName)
}

function getMapCapture2(fileName){
  getDisplayCapture2(fileName);     
}

function stopMapCapture(){
  stopDisplayCapture();
}

function formatDate (date, format) {

    if (typeof date === "number"){
      return date;
    }

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

/**
 * 凡例を作成・更新
 */
function updateLegend() {
    console.log("updateLegend")

    $("#legend").empty();
    let selectedLayerIds = getLayerIds();

    if(selectedLayerIds == null){
      selectedLayerIds = Object.keys(url_select_layerids);
    }    

    // NC
    if (selectedLayerIds != null && selectedLayerIds.includes("wni")) {
      var colorbarUrl = "img/wni_colorbar.png";
      var scaleUrl = "img/wni_colorbar_scale.png";
      var $legend = $("<div class=\"" + "wni" + " legend\"><div class=\"scale\"><div class=\"colorbar\"><img></div></div></div>");
      $legend.find("div.colorbar img").attr("src", colorbarUrl).addClass("opacity_0.8");
      $("#legend").append($legend);
    }
    // 日射量
    if (selectedLayerIds != null && selectedLayerIds.includes("amjp")) {
      colorbarUrl = "img/amjp_colorbar.png";
      var scaleUrl = "img/amjp_colorbar_scale.png";
      var $legend = $("<div class=\"" + "amjp" + " legend\"><div class=\"scale\"><div class=\"colorbar\"><img></div></div></div>");
      $legend.find("div.colorbar img").attr("src", colorbarUrl).addClass("opacity_0.8");
      $("#legend").append($legend);
    }
    // 気温
    if (selectedLayerIds != null && selectedLayerIds.includes("amjp_veda02_sshfs_tsfc")) {
      var colorbarUrl = "img/amjp_colorbar.png";
      var scaleUrl = "img/amjp_temp_colorbar_scale.png";
      var $legend = $("<div class=\"" + "amjp_temp" + " legend\"><div class=\"scale\"><div class=\"colorbar\"><img></div></div></div>");
      $legend.find("div.colorbar img").attr("src", colorbarUrl).addClass("opacity_opacity_0.8");
      $("#legend").append($legend);
    }
    // 湿度
    if (selectedLayerIds != null && selectedLayerIds.includes("amjp_veda02_sshfs_rh.sfc")) {
      var colorbarUrl = "img/amjp_colorbar.png";
      var scaleUrl = "img/amjp_humidity_colorbar_scale.png";
      var $legend = $("<div class=\"" + "amjp_humidity" + " legend\"><div class=\"scale\"><div class=\"colorbar\"><img></div></div></div>");
      $legend.find("div.colorbar img").attr("src", colorbarUrl).addClass("opacity_0.8");
      $("#legend").append($legend);
    }
    // 風速
    if (selectedLayerIds != null && selectedLayerIds.includes("amjp_veda02_sshfs_wnd")) {
      var colorbarUrl = "img/wnd_colorbar.png";
      var scaleUrl = "img/wnd_colorbar_scale.png";
      var $legend = $("<div class=\"" + "amjp_wnd" + " legend\"><div class=\"scale\"><div class=\"colorbar\"><img></div></div></div>");
      $legend.find("div.colorbar img").attr("src", colorbarUrl).addClass("opacity_0.8");
      $("#legend").append($legend);
    }

    // 人口
    $("#pop_legend").empty();
    $("#pop_legend").removeClass("pop_legend");
    if (selectedLayerIds != null && selectedLayerIds.includes("layer_town_color")) {
      var $legend = '';
      $legend += '<div><span style="background-color: #FF3300"></span>15,000超</div>';
      $legend += '<div><span style="background-color: #FF9966"></span>15,000</div>';
      $legend += '<div><span style="background-color: #FFCC33"></span>12,500</div>';
      $legend += '<div><span style="background-color: #FFFF33"></span>10,000</div>';
      $legend += '<div><span style="background-color: #CCFF00"></span>7,500</div>';
      $legend += '<div><span style="background-color: #99FF66"></span>5,000</div>';
      $legend += '<div><span style="background-color: #E0FFFF"></span>2,500</div>';
      $("#pop_legend").append($legend);
      $("#pop_legend").addClass("pop_legend");
    }

    // 人流
    $("#jinryu_legend").empty();
    $("#jinryu_legend").removeClass("jinryu_legend");
    if (selectedLayerIds != null && selectedLayerIds.includes("layer_jinryu")) {
      var $legend = '';
      if (jinryu_exist_date != ""){
        $legend += '<div>人流データがある日と場所<BR>' + jinryu_exist_date + '</div>';
      }
      $legend += '<div>デバイスID(すべて)</div>';
      $legend += '<div><span style="background-color: #00FF3B"></span>0003</div>';
      $legend += '<div><span style="background-color: #00F9A9"></span>0004</div>';
      $legend += '<div><span style="background-color: #B6FF01"></span>0005</div>';
      $legend += '<div><span style="background-color: #00ECFF"></span>0006</div>';
      $legend += '<div><span style="background-color: #005FFF"></span>0007</div>';
      $legend += '<div><span style="background-color: #D2691E"></span>000A</div>';
      $legend += '<div><span style="background-color: #CD5C5C"></span>000B</div>';
      $legend += '<div><span style="background-color: #A52A2A"></span>000C</div>';
      $legend += '<div><span style="background-color: #8B0000"></span>000D</div>';
      $legend += '<div><span style="background-color: #DC143C"></span>0011</div>';
      $("#jinryu_legend").append($legend);
      $("#jinryu_legend").addClass("jinryu_legend");
    }

    // アメダス
    if (selectedLayerIds != null && selectedLayerIds.includes(self_prepro_source_ids[0])) {

      const _layers = wgapp.map.getStyle().layers;
      const layerIndex = _layers.findIndex(l => l.id === self_prepro_source_ids[0] + "_L1");
      const layerDef = _layers[layerIndex];

      let $legend = '';
      let _colors = null;
      let _length = null;

      if(layerDef["paint"] != undefined){
        if (layerDef["paint"]["fill-extrusion-color"] != undefined){
          // ３Dグラフのもの
          _colors = layerDef["paint"]["fill-extrusion-color"];
          _length = _colors.length;
  
          const col_name = layerDef["paint"]["fill-extrusion-color"][1][1];
  
          if(col_name.indexOf("wind") >= 0){
            // 風速
            $legend += '<div class="amedas_legend_short">';
            $legend += '<span>m/s</span>';
          }else if(col_name.indexOf("snow") >= 0){
            // 積雪深
            $legend += '<div class="amedas_legend">';
            $legend += '<span>cm</span>';
          }else {
            // 雨量
            $legend += '<div class="amedas_legend">';
            $legend += '<span>mm</span>';
          }
        }else if (layerDef["paint"]["circle-color"] != undefined){
          // 平面の円のもの
          $legend += '<div class="amedas_legend_long">';
          _colors = layerDef["paint"]["circle-color"];
          _length = _colors.length;
  
          if(layerDef["paint"]["circle-color"][1][1].indexOf("temp") >= 0){
            // 気温
            $legend += '<span>℃</span>';
  
          }
        }
      }

      // 設定済みのレイヤ情報から凡例情報を取得
      $legend += '<div><span style="background-color: ' + _colors[_length-1] + ';"></span></div>';
      for(let i=_length-3; i>=2; i=i-2){ // i=0,1は別
        $legend += '<div><span style="background-color: ' + _colors[i] + ';"></span>' + _colors[i+1] + '</div>';
      }

      $legend += '</div>';

      $("#legend").append($legend);
    }

    // ごみ収集車（通常）
    if (selectedLayerIds != null && selectedLayerIds.includes(self_prepro_source_ids[1])) {
      let $legend = '';
      // 車体(L1から)
      const _layers = wgapp.map.getStyle().layers;
      const layerIndex = _layers.findIndex(l => l.id === self_prepro_source_ids[1] + "_L1");
      const layerDef = _layers[layerIndex];

      const _colors = layerDef["paint"]["fill-extrusion-color"];
      const _length = _colors.length;
      $legend += '<div class="garbage_legend_truck">';
      $legend += '<span>車体</span>';
      // 設定済みのレイヤ情報から凡例情報を取得
      for(let i=2; i<=_length-2; i=i+2){ // i=0,1は別
        $legend += '<div><span style="background-color: ' + _colors[i+1] + ';"></span>_' + _colors[i] + '</div>';
      }
      $legend += '</div>';
      $("#legend").append($legend);

      // 数値(L3から)
      const layerIndex_3 = _layers.findIndex(l => l.id === self_prepro_source_ids[1] + "_L3");
      if(layerIndex_3 >= 0){
        const layerDef_3 = _layers[layerIndex_3];

        const _colors_3 = layerDef_3["paint"]["text-color"];
        const _length_3 = _colors_3.length;
  
        const col_name = $("#col_name").val();

        let $legend2 = '';
        $legend2 += '<div class="garbage_legend">';
        if(col_name == "speed"){
          $legend2 += '<span>km/h</span>';
        }else if(col_name == "pm25"){
          $legend2 += '<span></span>';
        }else{
          $legend2 += '<span></span>';
        }
        $legend2 += '<div><span style="background-color: ' + _colors_3[_length_3-1] + ';"></span></div>';
        for(let i=_length_3-3; i>=2; i=i-2){ // i=0,1は別
          $legend2 += '<div><span style="background-color: ' + _colors_3[i] + ';"></span>' + _colors_3[i+1] + '</div>';
        }
  
        $legend2 += '</div>';
  
        $("#legend").append($legend2);
      }
    }

    // ごみ収集車（軌跡）
    else if (selectedLayerIds != null && selectedLayerIds.includes(self_prepro_source_ids[2])) {
      let $legend = '';
      const _layers = wgapp.map.getStyle().layers;
      const layerIndex = _layers.findIndex(l => l.id === self_prepro_source_ids[2] + "_L1");
      const layerDef = _layers[layerIndex];
      const _colors = layerDef["paint"]["line-color"];
      const _length = _colors.length;
      // 車体
      $legend += '<div class="garbage_legend_truck">';
      $legend += '<span>車体</span>';
      // 設定済みのレイヤ情報から凡例情報を取得
      for(let i=2; i<=_length-2; i=i+2){ // i=0,1は別
        $legend += '<div><span style="background-color: ' + _colors[i+1] + ';"></span>_' + _colors[i] + '</div>';
      }
      $legend += '</div>';
      $("#legend").append($legend);

      // 数値(L3から)
      const layerIndex_3 = _layers.findIndex(l => l.id === self_prepro_source_ids[1] + "_L3");
      if(layerIndex_3 >= 0){
        const layerDef_3 = _layers[layerIndex_3];

        const _colors_3 = layerDef_3["paint"]["text-color"];
        const _length_3 = _colors_3.length;
  
        let $legend2 = '';
        $legend2 += '<div class="garbage_legend">';
        $legend2 += '<span>km/h</span>';
        $legend2 += '<div><span style="background-color: ' + _colors_3[_length_3-1] + ';"></span></div>';
        for(let i=_length_3-3; i>=2; i=i-2){ // i=0,1は別
          $legend2 += '<div><span style="background-color: ' + _colors_3[i] + ';"></span>' + _colors_3[i+1] + '</div>';
        }
  
        $legend2 += '</div>';
  
        $("#legend").append($legend2);
      }

    }
  }

  
/**
 * 透過性を設定する共通関数
 * @param id    : レイヤID
 * @param value : 0-1(0から１までの小数点)
 */
function setOpacity(id, value){
  if(const_layer_jsons[id].type != "raster"){
    for (let l of const_layer_jsons[id]["layer"]) {
      setVectorPaintPropOpacity(l, value);
    }
  }else if(const_layer_jsons[id].type == "raster"){
    for (let l of const_layer_jsons[id]["layer"]) {
      wgapp.map.setPaintProperty(l, "raster-opacity", value );
    }
  }
}

/**
 * Vectorレイヤにおける透明度設定を共通した関数
 * @param layer    : レイヤオブジェクト
 * @param opacity : 0-1(0から１までの小数点)
 */
 function setVectorPaintPropOpacity(layer, opacity){
  if(isNaN(opacity)){
    return;
  }

  if(layer == self_prepro_source_ids[2] + "_L2" || layer == self_prepro_source_ids[2] + "_L3"){
    // 軌跡の円とラベルは除外する
    return;
  }

  if (wgapp.map.getLayer(layer).type == "fill") {
    wgapp.map.setPaintProperty(layer, "fill-opacity", opacity );
  } else if (wgapp.map.getLayer(layer).type == "background") {
    wgapp.map.setPaintProperty(layer, "background-opacity", opacity );
  } else if (wgapp.map.getLayer(layer).type == "line") {
    wgapp.map.setPaintProperty(layer, "line-opacity", opacity );
  } else if (wgapp.map.getLayer(layer).type == "symbol") {
    wgapp.map.setPaintProperty(layer, "icon-opacity", opacity );
    wgapp.map.setPaintProperty(layer, "text-opacity", opacity );
  } else if (wgapp.map.getLayer(layer).type == "circle") {
    wgapp.map.setPaintProperty(layer, "circle-opacity", opacity );
  } else if (wgapp.map.getLayer(layer).type == "fill-extrusion") {
    wgapp.map.setPaintProperty(layer, "fill-extrusion-opacity", opacity );
  }
}


