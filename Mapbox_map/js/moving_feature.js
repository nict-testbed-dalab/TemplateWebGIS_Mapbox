  /**
   * アメダスレイヤのレイヤスタイルを種類によって更新する
   */
  function setAmedasLayerPaint (layerDef) {
    // const col_name = $("#col_name").val();
    // dl_col_nameは取得した時点のカラム名

    if(dl_col_name == "temp"){
      // 気温
      layerDef["type"] = "circle";
      layerDef["paint"] =  {
        "circle-radius": 10,
        "circle-color":
          ["step",
              ["get", dl_col_name], // カラム名のまま定義
                "#002080",-5,
                "#0041FF",0,
                "#0096FF",5,
                "#B9EBFF",10,
                "#797B7D",15,
                "#FFFF96",20,
                "#FFF500",25,
                "#FF9900",30,
                "#FF2800",35,
                "#6C0068"
        ],
      }
    // }else if(col_name == "wind,winddirection"){
    }else if(dl_col_name == "wind"){
      // 風速
      layerDef["type"] = "fill-extrusion";
      layerDef["paint"] =  {
        "fill-extrusion-color":
          ["step",
              ["get", "wind"], // カラム名のまま定義
                "#797B7D",5,
                "#0041FF",10,
                "#FAF500",15,
                "#FF9900",20,
                "#FF2800",25,
                "#B40068"
        ],
        "fill-extrusion-height": ["get", "height"],
      }
    }else if(dl_col_name == "snow"){
      // 積雪深
      layerDef["type"] = "fill-extrusion";
      layerDef["paint"] =  {
        "fill-extrusion-color":
          ["step",
              ["get", dl_col_name], // カラム名のまま定義
                "#555555",1,
                "#A0D2FF",5,
                "#2190FF",20,
                "#0041FF",50,
                "#FFF500",100,
                "#FF9900",150,
                "#FF2800",200,
                "#B40068"
                // "#FF2800"
        ],
        "fill-extrusion-height": ["get", "height"]
      }
    }else{
      // 24時間降雨量
      layerDef["type"] = "fill-extrusion";
      layerDef["paint"] =  {
        "fill-extrusion-color":
          ["step",
              ["get", "precipitation24h"], // カラム名のまま定義
                "#555555",50,
                "#A0D2FF",80,
                "#2190FF",100,
                "#0041FF",150,
                "#FFF500",200,
                "#FF9900",250,
                "#FF2800",300,
                "#B40068"
        ],
        "fill-extrusion-height": ["get", "height"]
      }
    }

    return layerDef;
}


/**
 * アメダスデータのテキスト（ラベル）
 * 表示は観測所
 */
function setAmedasTextLayer(){
    // テキストレイヤ
    const layer2 =
    {
      "id": self_prepro_source_ids[0] + "_L2",
      "type": "symbol",
      "source": "layer_amedas",
      "layout": {
              "text-font": ['NotoSansCJKjp-Regular'],
              "text-field": ["get", "kjname"],
              "text-anchor": "bottom",
              "text-offset":[0,1.8],
              "text-size": 18
        },
      "paint": {
          "text-halo-color":"#FFFFFF",
          "text-halo-width":2,
          "text-color": "rgb(0,0,0)"
      },
      "minzoom": 7,
      "maxzoom": 18
    }  

    wgapp.map.addLayer(layer2);
}

// /**
//  * 日付キーJSONから行データのGeoJsonにする
//  * 各Featureに日付を追加
//  */
// function generateGeoJsonFromDateKey(source_id){
//   console.log("----generateGeoJsonFromDateKey")

//   const features_list = [];
//   for(let i=0; i<prepro_date_int_list[source_id].length; i++){
//     const date_key = prepro_date_int_list[source_id][i];
//     const features = geojson_data[source_id][date_key]['features'];

//     // 同一日時の複数の地物を追加
//     for(let j=0; j<features.length; j++){
//       features[j]['properties']['datetime'] = date_key
//       features_list.push(features[j])
//     }
//   }

//   // prepro_response_geojsonsを格納し直す
//   const ret_geom = {
//     "type": "FeatureCollection",
//     "features": features_list
//   };

//   geojson_data[source_id] = ret_geom;

    
//   if (source_id == self_prepro_source_ids[0]){
//     // アメダスデータのフィーチャ生成
//     generateAmedasFeatures();
//   }else{
//     // 移動体データのフィーチャ生成
//     generateMovingObjectFeatures(source_id);
//   }

// }

/**
 * 個体単位のデータ配列のから個体および日時の地物のGeoJsonを生成
 */
function generateSingleFeatureFromApiData(source_id){
  console.log("----generateSingleFeatureFromApiData")

  const features_list = [];
  for(let i=0; i<geojson_data[source_id].length; i++){

    const org_feature = geojson_data[source_id][i]["features"][0];
    const coordinates = org_feature['geometry']['coordinates'];

    const prop_keys = Object.keys(org_feature["properties"]);
    const _timezone = prop_keys['timezone']

    for(let j=0; j<coordinates.length; j++){
      const properties = {};
      for(let pk=0; pk<prop_keys.length; pk++){
        if(Array.isArray(org_feature["properties"][prop_keys[pk]]) == true){
          properties[prop_keys[pk]] = org_feature["properties"][prop_keys[pk]][j];
        }else{
          properties[prop_keys[pk]] = org_feature["properties"][prop_keys[pk]];
        }

        if(_timezone != undefined && _timezone != "None" && prop_keys[pk] == "datetime"){
          const _datetime = properties[prop_keys[pk]];
          const date_tz = formatToDateFromYYYYMMDDHHMISS(_datetime)
          date_tz.setHours( date_tz.getHours() + 9);
          const str_datetime = formatDate(date_tz, 'YYYYMMDDhhmmss');
          properties[prop_keys[pk]] = str_datetime;
        }
      }

      if(source_id != self_prepro_source_ids[2]){
        // 通常（点）
        const feat = {
          "type":"Feature",
          "properties":properties,
          "geometry":{
            "type":"Point",
            "coordinates": coordinates[j]
            }
          };
        features_list.push(feat)

      }else{
        // 過去の点をすべて含ませる
        const line_str = [];
        for(let li=j; li>0; li--){
          line_str.push(coordinates[li])
        }

        // 表示する単位の地物
        properties["plot_type"] = 0
        const feat = {
                  "type":"Feature",
                  "properties":properties,
                  "geometry":{
                    "type":"LineString",
                    "coordinates": line_str
                    }
                  };
        features_list.push(feat)

        // 軌跡の場合の点も同時に追加
        const properties2 = JSON.parse(JSON.stringify(properties));
        properties2["plot_type"] = 1
        const feat_point = {
          "type":"Feature",
          "properties":properties2,
          "geometry":{
            "type":"Point",
            "coordinates": coordinates[j]
            }
          };
        features_list.push(feat_point)
      }
    }
  }

  // prepro_response_geojsonsを格納し直す
  const ret_geom = {
    "type": "FeatureCollection",
    "features": features_list
  };

  geojson_data[source_id] = ret_geom;

  
  if (source_id == self_prepro_source_ids[0]){
    // アメダスデータのフィーチャ生成
    generateAmedasFeatures();
  }else{
    // 移動体データのフィーチャ生成
    generateMovingObjectFeatures(source_id);
  }
}


/**
 * アメダスデータの地物生成
 */
function generateAmedasFeatures() {

  let data = {
    "type": "FeatureCollection",
    "features": []
  };
  const _temp_data = geojson_data[self_prepro_source_ids[0]];

  _temp_data.features.forEach(function (object, i) {

    try{
      const point = object.geometry.coordinates
      let xy = wgapp.map.project(point);
      let feature = null;
      
      // カラムによる数値設定
      if ("precipitation24h" in object.properties || "snow" in object.properties){
        // ********************************************
        // 24時間降雨量または積雪量
        // ********************************************

        // 円柱
        const radius_size = 10 * Number($("#feature_size").val());
        xy.x += radius_size;
        let lnglat = wgapp.map.unproject(xy);
        lnglat = turf.point([lnglat.lng, lnglat.lat]);
    
        const radius = turf.distance(point, lnglat, {
          units: 'meters'
        }) + 0.00000001;

        if ("precipitation24h" in object.properties){
          if ((object.properties.precipitation24h == "") || (object.properties.precipitation24h == 0)) {
            object.properties.precipitation24h = 0;
            object.properties.height = 1;
          } else {
            object.properties.height = object.properties.precipitation24h * 100;
          }
        }else if ("snow" in object.properties){
          if ((object.properties.snow == "") || (object.properties.snow == 0)) {
            object.properties.snow = 0;
            object.properties.height = 1;
          } else {
            object.properties.height = object.properties.snow * 100;
          }
        }

        object.properties.index = i;
    
        const options = {
          steps: 16,
          units: 'meters',
          properties: object.properties
        };
    
        feature = turf.circle(point, radius, options);

      }else if ("temp" in object.properties){
        // ********************************************
        // 気温
        // ********************************************
        object.properties.index = i;
        feature = object;


      }else if ("wind" in object.properties){
        // ********************************************
        // 風速
        // ********************************************
        xy.x += 0.25 * Number($("#feature_size").val());

        const lnglat = wgapp.map.unproject(xy);
        const lnglat_obj = turf.point([lnglat.lng, lnglat.lat]);
    
        const distance = turf.distance(point, lnglat_obj, {
          units: 'meters'
        }) + 0.00000001;
    
        // 矢印(⇒)型の平面を生成
        const _x1 = 0.0005 * distance;
        const _y1 = 0.0003 * distance;
        // const _x2 = 0.0008 * distance;
        const _y2 = 0.0008 * distance;
    
        const point1 = [Number(lnglat.lng)            , lnglat.lat];
        const point2 = [Number(lnglat.lng) + _x1      , lnglat.lat + (-1) *_y1];
        const point3 = [Number(lnglat.lng)            , lnglat.lat + _y2];
        const point4 = [Number(lnglat.lng) + (-1) *_x1, lnglat.lat + (-1) * _y1];

        const features = turf.polygon([ [point1, point2, point3, point4, point1] ]);
    
        if ("winddirection" in object.properties){
          // 向きあり
          const options = {pivot: point1};
          const angle = Number(object.properties.winddirection);
          const rotatedPoly = turf.transformRotate(features, angle, options);
          feature = rotatedPoly;
        }else{
          feature = features;
        }
    
        object.properties.height = 100; // 高さは一定
        object.properties.index = i;

        feature.properties = object.properties

      }
  
      // 各地物をFeaturesに格納
      if(feature != null){
        feature.id = i;
        data.features.push(feature);
      }
      
    } catch(err) {
      console.log(err);
      // continue;
    }

  })

  // ソースIDごとのgeojsonデータに格納
  geojson_data[self_prepro_source_ids[0]] =  data;

}


/**
 * 移動体データ（ごみ収集車）の地物(2.5次元)生成
 */
function generateMovingObjectFeatures(source_id) {
  let data = {
    "type": "FeatureCollection",
    "features": []
  };
  // const feature_size = 0.4; // 大きさの目安値
  const feature_size = 0.4 * Number($("#feature_size").val());
  const radius_size = 10 * Number($("#feature_size").val());
  const trj_line_width = 15 * Number($("#feature_size").val());
  const _temp_data = geojson_data[source_id];

  _temp_data.features.forEach(function (object, i) {

    let feature = null;
    let feature2 = null;
    if (source_id == self_prepro_source_ids[1]){
      // ********************************************
      // 車体と棒グラフ（円柱）の地物を生成する
      // ********************************************

      // ********************************************
      // 車体
      // ********************************************
      const point = object.geometry.coordinates
      let xy = wgapp.map.project(point);
      xy.x += feature_size;
      const lnglat = wgapp.map.unproject(xy);
      const lnglat_obj = turf.point([lnglat.lng, lnglat.lat]);

      const distance = turf.distance(point, lnglat_obj, {
        units: 'meters'
      }) + 0.00000001;

      // 凸型の平面を生成
      const _x1 = 0.0005 * distance;
      const _x2 = 0.0003 * distance;
      const _y1 = 0.0008 * distance;
      const _y2 = 0.0011 * distance;
      const _x3 = (-1) * _x2;
      const _x4 = (-1) * _x1;

      // 底辺の中間点から右回り
      const point1 = [Number(lnglat.lng)      , lnglat.lat];
      const point2 = [Number(lnglat.lng) + _x1, lnglat.lat];
      const point3 = [Number(lnglat.lng) + _x1, lnglat.lat + _y1];
      const point4 = [Number(lnglat.lng) + _x2, lnglat.lat + _y1];
      const point5 = [Number(lnglat.lng) + _x2, lnglat.lat + _y2];
      const point6 = [Number(lnglat.lng) + _x3, lnglat.lat + _y2];
      const point7 = [Number(lnglat.lng) + _x3, lnglat.lat + _y1];
      const point8 = [Number(lnglat.lng) + _x4, lnglat.lat + _y1];
      const point9 = [Number(lnglat.lng) + _x4, lnglat.lat];

      const features = turf.polygon([ [point1, point2, point3, point4, point5, point6, point7, point8, point9, point1] ]);

      // フィーチャに設定
      feature = features;

      // 車両の向き
      const angle = Number(object.properties.direction);
      if (isNaN(angle) != true){
        // 方向があれば回転させる
        // 回転オプション（軸）
        const options = {pivot: point1};
        feature = turf.transformRotate(feature, angle, options);
      }
      
      // 車体のプロパティ（ディープコピー）
      feature.properties = JSON.parse(JSON.stringify(object.properties));

      // 高さもズームによって変動
      if (object.properties.speed != undefined){
        feature.properties.data = object.properties.speed
      }else if (object.properties.pm25 != undefined){
        feature.properties.data = object.properties.pm25
      }else{
        feature.properties.data = "";
      }
      feature.properties.height = 100 * distance * 0.5;
      feature.properties.height2 = -1;

      // 円柱の位置のため、最大のXと中間のためのYを取得
      const coordinates = feature.geometry.coordinates[0];
      let max_x = coordinates[0][0];
      let max_y = coordinates[0][1];
      let min_y = coordinates[0][1];
      for(let pi=1; pi<coordinates.length; pi++){

        let x = coordinates[pi][0];
        let y = coordinates[pi][1];
        if(x > max_x){
          max_x =x;
        }

        if(y > max_y){
          max_y =y;
        }
        if(y < min_y){
          min_y =y;
        }
      }

      // ********************************************
      // 円柱
      // ********************************************
      const point_circle = [max_x, (max_y+min_y)/2];
      let xy_circle = wgapp.map.project(point_circle);
      xy_circle.x += radius_size;
      let lnglat_circle = wgapp.map.unproject(xy_circle);
      lnglat_circle = turf.point([lnglat_circle.lng, lnglat_circle.lat]);

      const radius = turf.distance(point_circle, lnglat_circle, {
        units: 'meters'
      }) + 0.00000001;

      object.properties.index = i;
      
      const options = {
        steps: 16,
        units: 'meters',
        properties: object.properties
      };

      // 右にずらす
      point_circle[0] = point_circle[0] + radius/60000;
      // point_circle[1] = point_circle[1] + radius/50000;
      feature2 = turf.circle(point_circle, radius, options);
      feature2.id = i;

      // 高さはデータ(速度など）*100
      feature2.properties.height = -1;

      if (object.properties.speed != undefined){
        feature2.properties.data = object.properties.speed
      }else if (object.properties.pm25 != undefined){
        feature2.properties.data = object.properties.pm25
      }else{
        feature2.properties.data = "";
      }
      feature2.properties.height2 = Number(feature2.properties.data) * 100


    }else{
      // ********************************************
      // 軌跡の場合
      // ********************************************

      // 地物情報（下記以外の変換なし）
      feature = object;

      // 幅と最終円の半径
      feature.properties.width = trj_line_width;
      feature.properties.radius = trj_line_width * 0.66;

      // データ
      if (object.properties.speed != undefined){
        feature.properties.data = object.properties.speed
      }else if (object.properties.pm25 != undefined){
        feature.properties.data = object.properties.pm25
      }else{
        feature.properties.data = "";
      }

    }

    // 地物id
    feature.id = i;

    // idとは別に、車体別の色にするための識別子
    let temp_id = Number(object.properties.identifier) ;
    feature.properties.id = temp_id % 7;
    if (feature.properties.id == 0){
      feature.properties.id = 7;
    }
    // リストに追加
    data.features.push(feature);

    if(feature2 != null){
        // idとは別に、車体別の色にするための識別子
        feature2.properties.id = temp_id % 7;
        if (feature2.properties.id == 0){
          feature2.properties.id = 7;
        }
        // リストに追加
        data.features.push(feature2);
    }

  })

  // geojsondataを更新
  geojson_data[source_id] =  data;

}


