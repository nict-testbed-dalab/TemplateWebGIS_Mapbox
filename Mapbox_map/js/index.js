/******************************************************************************/
/* Copyright (c) NICT. All rights reserved.                                   */
/* See License.txt for the license information.                               */
/******************************************************************************/

let wgapp = {};
wgapp.val = 1;    
accessToken = ""
url_select_layerids = {} // URLで選択レイヤのsource_idと透明度のJson{source_id:{opacity:値}}}

jinryu_exist_date = "" // 人流データが存在している年月日

g_current_p = Date.now();

// 基盤地図
const base_map_inputs = document.getElementById('base_menu').getElementsByTagName('input');

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

// 基盤地図選択変更イベント
for (const input of base_map_inputs) {
  input.onclick = (layer) => {
    wgapp.map.once("styledata", make_layers); 
    wgapp.map.setStyle('./json/base_map/' + layer.target.id + '.json?date=20220221_5');
  }
}

let layers_info = null;
 
wgapp.map.on("load", () => {
  readGeoJSON();
  // jsonファイルを読み込み、Layerを表示する
  make_layers();

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
      const response = await fetch(path+"?date=20220228_3");
      if (response.ok) {
        return await response.json();
      } else {
        console.log("HTTP-Error: " + response.status);
        return null;
      }
    } catch(err) {
      console.log(err);
      return null;
    }
}

// GeoJSONファイルを解析して読み込む
amedass_flg = 0;
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

  // console.log("selectedLayerIds", selectedLayerIds)

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

  if (selectedLayerIds.includes("layer_amedas")) {
   if (amedass_flg == 1) {
     return null;
   }
   path = "https://tb-gis-web.jgn-x.jp/api/t_amedas_data?point_1=" 
		+ point_1 + "&point_2=" + point_2 + "&point_3=" + point_3 + "&point_4=" + point_4 + "&currentDate=" + selected_yyyymmdd + selected_hhmi;
   try{
      amedass_flg = 1;
      const response = await fetch(path);
      if (response.ok) {
        geojson_data["layer_amedas"] =  await response.json();
        setAmedasLayerSource();
        setGeojsonLayerSource("layer_amedas_L1","layer_amedas");
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

  console.log("readGeoJSON end")
}


/**
 * Layer情報をJSONから取得する
**/
async function get_layer_info() {
  ret_array = []; // 初期化
  json = null;  
  for(key in layer_jsons){
    aaa = key;
    if (layer_jsons[key].path =='vectortile') {
      json = await readJSON(vectortile_data_path + key + '/latest/style.json');
      ret_array.push([aaa,json,layer_jsons[aaa].path]);
    } else if (layer_jsons[key].path =='etc_1') {
      json = await readJSON(etc_data_path + key + '.json');
      ret_array.push([aaa,json,layer_jsons[aaa].path]);
    } else if (layer_jsons[key].path =='etc_2') {
      json = await readJSON(etc_data_path + key + '.json');
      ret_array.push([aaa,json,layer_jsons[aaa].path]);
    } else if (layer_jsons[key].path =='geojson') {
      json = await readJSON(etc_data_path + key + '.json');
      ret_array.push([aaa,json,layer_jsons[aaa].path]);
    } else if (layer_jsons[key].path =='geojson2') {
      json = await readJSON(etc_data_path + key + '.json');
      ret_array.push([aaa,json,layer_jsons[aaa].path]);
    }  else if (layer_jsons[key].path =='pointcloud') {
      ret_array.push([aaa,"",layer_jsons[aaa].path]);
    }  else if (layer_jsons[key].path =='polygoncloud') {
        ret_array.push([aaa,"",layer_jsons[aaa].path]);
    }  else if (layer_jsons[key].path =='poppointcloud') {
        ret_array.push([aaa,"",layer_jsons[aaa].path]);
    }
  }
  return ret_array;
}

etc_2_tiles = {}
geojson_data = {}
async function make_layers() {
  console.log("----------make_layers")
  addPopulationLayer();
  fflag = 0;
  if (layers_info == null){
    layers_info = await get_layer_info();
  } else {
    fflag = 1;
  }

  for(m_info of layers_info){
    const source_id = m_info[0];
    const path = m_info[2];

    try{
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
      	wgapp.map.addSource(source_id, {
          type: "geojson",
          data: geojson_data[source_id],
        })
      }  else if (path == "geojson2") {
        wgapp.map.addSource(source_id, {
          type: "geojson",
          data: m_info[1].sources[source_id].data,
        })
      }
    } catch(err) {
      console.log(err);
    }

    const menu_box = document.getElementById("menu-box" + source_id);       

    if (layer_jsons[source_id]["type"] == "pointcloud") {
      if (source_id in url_select_layerids){
        if (wgapp.map.getLayer(layerId)) {
          wgapp.map.removeLayer(layerId);
        }
        addPointCloudLayer(wgapp.map, 'point_cloud', './data/sample.csv');
      }
    } else if(layer_jsons[source_id]["type"] == "polygoncloud") {
      if (source_id in url_select_layerids){
        if (wgapp.map.getLayer(layerId)) {
          wgapp.map.removeLayer(layerId);
        }
        addPlaneGroupLayer(wgapp.map, 'polygon_cloud', './data/sample.json');
      }
    } else if(layer_jsons[source_id]["type"] == "poppointcloud") {
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
	        if (fflag == 0) {
            layer.id = source_id + '_' + layer.id;
          }
	        layer_jsons[source_id]["layer"].push(layer.id);
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

}

/**
  * Layer選択メニュー(side-menu)を作成
  * ・・・選択時と未選択時の両方のdivを作成しておき、style="display:xxx"で、活性・非活性で制御する。
  * 
  * mapがidle状態になる前に実行
*/
// let sourcr_type_list = {}
wgapp.map.on('idle', () => {
  console.log("####idle start");
  // Layer単位で生成
  for(key in layer_jsons){
    _info = layer_jsons[key]
    const id = key;
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

  for (k in group_list) {
    data_select_box = document.createElement('div');
    data_select_box.className = 'data_select_box';

    for (d of group_list[k]) {
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
        const id = this.id.replace("menu-box2","");
        const menu_box = document.getElementById("menu-box" + id);
        // 表示
        if (id == "point_cloud") {
          addPointCloudLayer(wgapp.map, 'point_cloud', './data/sample.csv');
          menu_box.style="display: flex;";
          this.style="display: none;";
        } else if (id == "pplygon_cloud") {
            addPointCloudLayer(wgapp.map, 'pplygon_cloud', './data/sample.json');
            menu_box.style="display: flex;";
            this.style="display: none;";
        } else {		
            for (l of layer_jsons[id]["layer"]) {
              wgapp.map.setLayoutProperty(l, 'visibility', 'visible');
              menu_box.style="display: flex;";
              this.style="display: none;";
              // 凡例も
              const legend = document.getElementById('lg_' + l);
              if(legend){
                  legend.className = 'legend';
              }    
            }

            if(id == "bargraph_source"){
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
      const id = this.id.replace("menu-box","");
      console.log('表示から dblclick', id);

      const menu_box2 = document.getElementById("menu-box2" + id);                      
      // 非表示
      if ((id == "point_cloud") || (id == "polygon_cloud")) {
        if (wgapp.map.getLayer(id)) {
          wgapp.map.removeLayer(id);
        }
        this.style="display: none;";
        menu_box2.style="display: flex;";
      } else {
        for (l of layer_jsons[id]["layer"]) {
          wgapp.map.setLayoutProperty(l, 'visibility', 'none');
          this.style="display: none;";
          menu_box2.style="display: flex;";
          // 凡例も
          const legend = document.getElementById('lg_' + l);
          if(legend){
            legend.className = 'legend-disable';
          }
	      }

        if(id == "bargraph_source"){
          $("#bargraph_controller").addClass("hidden");
        }

      }
      layer_update("",g_current_p);
    });

    /***********************************************************
    * スライダー変動による透明度の変更
    ***********************************************************/
     $('.data_select_box .ctrl_enabled').mouseup(function () {
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

wgapp.map.on('moveend', () => {
  readGeoJSON();
});

function layer_update(fileName,current_p) {
  console.log("<><><> layer_update start");
  g_current_p = current_p;
  readGeoJSON();

  // readGeoJSONでset済み
  // if (getLayerIds().includes("layer_jinryu")) {
  //   setGeojsonLayerSource("layer_jinryu_L1","layer_jinryu");
  // }
  // if (getLayerIds().includes("layer_amedas")) {
  //   setGeojsonLayerSource("layer_amedas_L1","layer_amedas");
  // }
  let selectedLayerIds = getLayerIds();
  // URLから選択された場合を考慮（まだLayerは生成されていない）
  if(selectedLayerIds == null){
    selectedLayerIds = Object.keys(url_select_layerids);
  }

  // etc_2_tiles
  for (key in etc_2_tiles) {
      tile = get_etc_2_tile(key);
      for (l of layer_jsons[key]["layer"]) {
        if (selectedLayerIds != null && selectedLayerIds.includes(key)) {
          setLayerSource(l,layer_jsons[key]["type"],key,tile);
        }
      }
  }

  // 点群
  if (selectedLayerIds != null && selectedLayerIds.includes("point_cloud")) {
    updateBargraph();
  }
  // 面群
  if (selectedLayerIds != null && selectedLayerIds.includes("polygon_cloud")) {
    updatePlaneGroupLayer();
  }
  // 人口
  if (selectedLayerIds != null && selectedLayerIds.includes("bargraph_source")) {
    updatePopulationLayer();
    // 設定も表示
    $("#bargraph_controller").removeClass("hidden");
  }
  // 画面キャプチャ実行
  if(fileName != undefined && fileName != ""){
    getMapCapture2(fileName)
  }
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

function setGeojsonLayerSource (layerId,sourceLayer) {
    const oldLayers = wgapp.map.getStyle().layers;
    const layerIndex = oldLayers.findIndex(l => l.id === layerId);
    const layerDef = oldLayers[layerIndex];
    const before = oldLayers[layerIndex + 1] && oldLayers[layerIndex + 1].id;

    try{
      wgapp.map.removeLayer(layerId);
      wgapp.map.removeSource( sourceLayer );
      wgapp.map.addSource(
        sourceLayer, {
          type : "geojson",
          data : geojson_data[sourceLayer]
        }
      );
      wgapp.map.addLayer(layerDef, before);
    } catch(err) {
      console.log(err);
    }
}


/**
 * アメダスデータのレイヤ追加
 */
function setAmedasLayerSource() {
  let data = {
    "type": "FeatureCollection",
    "features": []
  };
  let radius_size = 10;
  bargraph_data = geojson_data["layer_amedas"];

  bargraph_data.features.forEach(function (object, i) {
    const point = object.geometry.coordinates
    let xy = wgapp.map.project(point);
    xy.x += radius_size;
    let lnglat = wgapp.map.unproject(xy);
    lnglat = turf.point([lnglat.lng, lnglat.lat]);
    const radius = turf.distance(point, lnglat, {
      units: 'meters'
    }) + 0.00000001;
    if ((object.properties.precipitation24h == "") || (object.properties.precipitation24h == 0)) {
        object.properties.height = 1;
    } else {
        object.properties.height = object.properties.precipitation24h * 100;
    }
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
  geojson_data["layer_amedas"] =  data;

  // 別途呼び出し済み
  // setGeojsonLayerSource("layer_amedas_L1","layer_amedas");
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
      for (id of bargraphlayers) {
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
  for (layer of layerIds){
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

function updateLegend() {
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


  }

/**
 * 透過性を設定する共通関数
 * @param id    : レイヤID
 * @param value : 0-1(0から１までの小数点)
 */
function setOpacity(id, value){
  if(layer_jsons[id].type != "raster"){
    for (l of layer_jsons[id]["layer"]) {
      setVectorPaintPropOpacity(l, value);
    }
  }else if(layer_jsons[id].type == "raster"){
    for (l of layer_jsons[id]["layer"]) {
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