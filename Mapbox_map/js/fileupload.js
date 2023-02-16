
  /**
   * Geojsonをアップロードするエリアの生成
   * 経度緯度のフォーマットについて
   *  https://docs.mapbox.com/api/overview/#coordinate-format
   */
  function appendHTMLgeojson_upload() {

    $("#geojson_upload").empty();

    $geojson_upload  = '<div id="uploadArea" class="uploadArea">';
    $geojson_upload += '<div id="uploadHeader">Geojson追加:<span>ドラッグ&ドロップ</span></div>';
    $geojson_upload += '  <input type="file" name="fileb" id="fileinput1" accept=".geojson" onchange="fileselect(this);" />';
    $geojson_upload += '  <div id="upload_1" class="uploadList">　指定なし：固定の色のみ</div>';
    $geojson_upload += '  <input type="file" name="fileb" id="fileinput2" accept=".geojson" onchange="fileselect(this);" />';
    $geojson_upload += '  <div id="upload_2" class="uploadList">　領域：市区町村の人口など</div>';
    $geojson_upload += '  <input type="file" name="fileb" id="fileinput3" accept=".geojson" onchange="fileselect(this);" />';
    $geojson_upload += '  <div id="upload_3" class="uploadList">　円：市区町村の人口など</div>';
    $geojson_upload += '  <input type="file" name="fileb" id="fileinput4" accept=".geojson" onchange="fileselect(this);" />';
    $geojson_upload += '  <div id="upload_4" class="uploadList">　線：行政境界など</div>';
    $geojson_upload += '  <input type="file" name="fileb" id="fileinput5" accept=".geojson" onchange="fileselect(this);" />';
    $geojson_upload += '  <div id="upload_5" class="uploadList">　立体的：PLATEAUなど</div>';

    $geojson_upload += '  <input type="file" name="fileb" id="fileinput6" accept=".json" onchange="fileselectMF(this);" />';
    $geojson_upload += '  <div id="upload_6" class="uploadList">　MF-JSON：</div>';
    $geojson_upload += '</div>';

    $("#geojson_upload").append($geojson_upload);
  }

  /**
   * Geojsonのレイヤをチェックボックスで表示／非表示
   * id:チェックボックスのid
   */
  function fncGeojsonLayerVisible(chk_id){
    let input_check = document.getElementById(chk_id);
    if (input_check != null){
      layer_id = chk_id.replace("chk_","")
      if (input_check.checked == true){
        wgapp.map.setLayoutProperty(layer_id, 'visibility', 'visible'); 
      }else{
        wgapp.map.setLayoutProperty(layer_id, 'visibility', 'none'); 
      }
    }
  }

  
  /**
   * Geojsonファイルを読み込み、解析してレイヤ表示する。
   * レイヤのスタイルを該当する項目によって設定する。
   */
  var fileselect = (e) => {
    const inputFileList = document.querySelector('#'+e.id).files;
  
    if(inputFileList.length === 0) {
        //  html += '<a class="list-group-item">ファイルが選択されていません</a>';
        //  html += '</div>';
                 
        //  result_inner = document.getElementById('preview');
        //  result_inner.insertAdjacentHTML('afterbegin',html)
        //  sendbutton.style.display ="none";
  
    } else {
      let inputFile = inputFileList[0] // 単一前提
      const layer_name = inputFile.name.replace(".geojson","")

      let div_name = "upload_" + e.id.replace("fileinput","")

      // 即時表示
      const reader = new FileReader(inputFile);
      reader.readAsText(inputFile);

      // 読込んでレイヤに追加
      reader.onload = function(e){
        // JSONとして認識させる
        let geojson_obj = reader.result.replace(/[\n\r]/g,""); 
        const geojson_eval = eval("(" + geojson_obj + ")");

        // 各idはdiv_nameとする(上書きするため)
        const source_id = div_name
        const layer_id = div_name

        // すでにあれば削除
        if (wgapp.map.getLayer(layer_id)) {
          wgapp.map.removeLayer(layer_id);
          wgapp.map.removeSource( source_id );
        }

        // ソース追加
        wgapp.map.addSource(source_id, {
          type: 'geojson',
          data: geojson_eval,
        });

        // ジオメトリタイプを取得（最初の１行）
        feature = geojson_eval.features[0]
        let layer_type =""
        let _layout ={}
        let _paint = {}
        let _type = feature.geometry.type
        if (div_name == 'upload_3' && _type == 'Point'){
          // 点
          layer_type = 'circle';

          // 人口がある場合
          if ('人口' in feature.properties){
            _paint = {
              "circle-color":
              [
                  "step",
                  ["get", "人口"],
                  "#fdccb8",100000,
                  "#f44d38",150000, 
                  "#f44d38",200000, 
                  "#c5161c"
              ],
              "circle-radius":[
                  "step",
                ["get", "人口"],
                12, 100000,
                20, 200000,
                30
              ]
            }
          }else{
            _paint = {
              "circle-color":"#c5161c"
            }
          }
         
        }else if(div_name == 'upload_4' &&  (_type == 'LineString' || _type == 'MultiLineString')){
          // 線
          layer_type = 'line';

          _paint =  {
            'line-color': "#fb7050",
            'line-width': 1
          }

        }else {
          // ポリゴン

          if (div_name == 'upload_5' && 'height' in feature.properties){
            // 立体的（PLATEAUなど）
            layer_type = 'fill-extrusion';
            _paint = {
              'fill-extrusion-color': "#008000",
              'fill-extrusion-height': ['get', 'height'],
            }

          }else{
            // 領域
            if (div_name == 'upload_2' && '人口' in feature.properties){
              // 人口がある場合
              layer_type = 'fill';
              const population_color_fill =  [
                'step',
                ['get', '人口'],
                '#fdccb8',100000,
                '#f44d38',150000, 
                '#f44d38',200000, 
                '#c5161c'
              ];
              _paint = {
                'fill-color': population_color_fill,
                'fill-opacity':0.7,
              }
            }else{

              // 指定レイヤとGeoJson内容が一致しない場合
              // 結局GeoJsonで分岐

              if (_type == 'Point'){
                layer_type = 'circle';
                _paint = {
                  "circle-color":"#c5161c"
                }
              }else if(_type == 'LineString' || _type == 'MultiLineString'){
                layer_type = 'line';
                _paint =  {
                  'line-color': "#fb7050",
                  'line-width': 1
                }                
              }else{
                layer_type = 'fill';
                _paint = {
                  'fill-color': "#008000",
                  'fill-opacity':0.7,
                }
              }

            }

          }
        }

        wgapp.map.addLayer({
          'id': layer_id,
          'type': layer_type, //fill, line, symbol, circle, heatmap, fill-extrusion, raster, hillshade, background
          'source': source_id,
          'layout': _layout,
          'paint': _paint,
        });


        // 画面のレイヤ欄を更新

        // 選択した行の先頭文字はそのまま
        let layer_header = ""
        if (div_name == 'upload_1'){
          layer_header ="指定なし："
        }else if (div_name == 'upload_2'){
          layer_header = '領域：';
        }else if (div_name == 'upload_3'){
          layer_header = '円：';
        }else if (div_name == 'upload_4'){
          layer_header = '線：';
        }else if (div_name == 'upload_5'){
          layer_header = '立体的：';
        }

        let html_str = '<div><input type="checkbox" id="chk_' + div_name + '" onchange=fncGeojsonLayerVisible(this.id) checked/>';
        html_str += layer_header +  layer_name;
        html_str += '</div>';
                   
        let result_inner = document.getElementById(div_name);
        result_inner.innerHTML = html_str;

      }

    }

  }
  

  /**
   * MF-JSONファイルを読み込み、解析して属性に日時を含めた通常形式のGejsonを生成する。
   * レイヤ表示はupdateMfJsonLayerを呼び出している。
   * レンジバー設定は、親フレームのfncSetRangeを呼び出している。
   */
  var fileselectMF = (e) => {
    console.log("fileselectMF start")
    const inputFileList = document.querySelector('#'+e.id).files;
  
    if(inputFileList.length !== 0) {
      let inputFile = inputFileList[0]; // ファイルは単一前提
      const layer_name = inputFile.name.replace(".json","");
      let div_name = "upload_" + e.id.replace("fileinput","");

      // 読み込み(onload)
      const reader = new FileReader(inputFile);
      reader.readAsText(inputFile);
      reader.onload = function(e){
        // ***********************************
        // オブジェクトとして取得
        // ***********************************
        const mf_obj = eval("(" + reader.result.replace(/[\n\r]/g,"") + ")");
        let mf_jsons = []
        if (Array.isArray(mf_obj)){
          // 配列の場合
          mf_jsons = mf_obj;
        }else{
          // 単一JSONの場合
          mf_jsons = [mf_obj];
        }

        // source_id単位のクラス変数を初期化
        const source_id = div_name; 
        const features = []; // 地物リスト
        const point_features = [];  // 領域のための点リスト
        date_int_list[source_id] = []; // 初期はindex.jsで定義
        let geom_type = null;

        // ***********************************
        // 1つのレイヤであるが、ファイルのJSON単位でループ
        // ***********************************
        for(let json_i=0; json_i<mf_jsons.length; json_i++){
          const mf_json = mf_jsons[json_i];
          let datetimes = null;
          let coordinates = null;
          let properties = null;
  
          // ***********************************
          // 時刻と位置の取得
          if ('temporalGeometry' in mf_json){
            geom_type = mf_json['temporalGeometry']['type']; // MovingPoint
            coordinates = formatCordinatesToWGS84(mf_json['temporalGeometry']['coordinates'], geom_type);
            datetimes = mf_json['temporalGeometry']['datetimes'];
            properties = mf_json['temporalProperties'];
          }else{
            // 通常のgeojson形式だった場合
            geom_type = mf_json['geometry']['type'];
            coordinates = formatCordinatesToWGS84(mf_json['geometry']['coordinates'], geom_type);
            datetimes = mf_json['properties']['datetimes'];
            properties = mf_json['properties'];
          }
          // console.log("####coordinates", coordinates)
          if (coordinates.length <= 0){
            // 地物がない
            console.log("地物がない");
            continue;
          }

          // ***********************************
          // プロパティの取得と保存
          let prop = {};
          for (let i = 0; i < properties.length; i++) {
            const mf_properties = properties[i];
            mf_key = Object.keys(mf_properties);

            mf_key.forEach(function(key){
              if('values' in mf_properties && 'name' in mf_properties){
                // datetimes,values,nameが同階層の場合
                prop[mf_properties['name']] = mf_properties['values']
              }else if('values' in mf_properties[key]){
                // datetimesの配下にvaluesを含む属性のJSONがある場合
                prop[key] = mf_properties[key]['values']
              }else{
                prop[key] = mf_properties[key]
              }
            });
            // console.log("prop",prop)
          }

          // ***********************************
          // 地物に格納
          // ***********************************
          // 地物のタイプ設定
          let featrue_type = ""
          if (geom_type.indexOf("Point") >= 0){
            featrue_type = "Point";
          }else if(geom_type.indexOf("Polygon") >= 0){
            featrue_type = "Polygon";
          }else if(geom_type.indexOf("Line") >= 0){
            featrue_type = "LineString";
          }

          // ***********************************
          // 日時単位でループして地物取得とリスト追加
          // ***********************************
          let date_idx=0; // 日付ではなくindex
          datetimes.forEach(function(dtime){
            // 該当するプロパティの取得
            let feature = {"type": "Feature", "properties":{}, "geometry":{}};
            prop_keys = Object.keys(prop);
            prop_keys.forEach(function(p_key){
              feature["properties"][p_key] = prop[p_key][date_idx];
            });

            // プロパティに日時を入れる（フィルター表示するため）
            const date_obj = new Date(dtime);
            feature["properties"]["datetime"] = date_obj.getTime(); // タイムスタンプ

            if (featrue_type == "Point" || featrue_type == "Polygon" ){
              // 単一点、ポリゴンの場合
              feature["geometry"] ={"type": featrue_type, "coordinates": coordinates[date_idx]};

            }else{
              // 線や軌跡の場合
              // 時間増加とともにそれまでの位置情報も格納
              let line_string = [];
              for (let line_i=0; line_i<=date_idx; line_i++){
                line_string.push(coordinates[line_i]);
              }
              feature["geometry"] ={"type": featrue_type, "coordinates": line_string};
            }

            // 全体GeoJsonのフィーチャに追加
            features.push(feature);

            if(isNaN(date_obj.getDate()) != true){
              // 日時リストにも追加
              date_int_list[source_id].push(Number(date_obj.getTime())); // 一致するため
            }else{
              console.log("日付が誤った形式です。", dtime);
            }
            
            // 移動先の中心のための点のリスト
            if (featrue_type == "Polygon"){
              point_features.push(coordinates[date_idx][0][0]); // 始点を追加（結果的におよその中心点で十分であるため）
            }else{
              point_features.push(coordinates[date_idx]);
            }

            date_idx++
          }); // end datetimes

        } // mf_jsons end

        // ***********************************
        // GeoJson生成（上記フィーチャ付き）
        // ***********************************
        mf_json_time_geojsons[source_id] = {
          "type": "FeatureCollection",
          "crs": { "type": "name",
          "properties": {
            "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
            }
          },
          'geom_type': geom_type,
          "features": features
        };

        // 時刻範囲設定
        const startTime = date_int_list[source_id][0];
        const endTime = date_int_list[source_id][date_int_list[source_id].length-1];

        // ***********************************
        // 開始時刻で表示
        // ***********************************
        updateMfJsonLayer(startTime, true)

        // ***********************************
        // 日付zoomを設定する 
        // ***********************************
        // レンジバー設定
        window.parent.fncSetRange(startTime, endTime);
        
        // ***********************************
        // 移動とズーム
        // ***********************************

        const center = turf.center(turf.points(point_features));
        let _move_point = center["geometry"]["coordinates"];
        let _end_point = [];

        // 中心点から最小位置の線の長さからズームを算出
        var all_line = turf.lineString(point_features);
        var bbox = turf.bbox(all_line);
        _end_point = [bbox[0],bbox[1]];   // minX, minY
        var line = turf.lineString([_move_point, _end_point]);
        const line_length = turf.length(line, {units: 'kilometers'});

        let _zoom = 2;
        if (line_length < 20){
          _zoom = 12;
        }else if (line_length < 3000){
          _zoom = 3;
        }

        // 移動実行
        // prepro_move_flg = true;
        wgapp.map.flyTo({
          center: _move_point,
          zoom: _zoom,
        });

        // ファイル名を表示
        let html_str = '<div><input type="checkbox" id="chk_' + div_name + '" onchange=fncGeojsonLayerVisible(this.id) checked/>';
        html_str += 'MF-JSON:' +  layer_name;
        html_str += '</div>';
                  
        let result_inner = document.getElementById(div_name);
        result_inner.innerHTML = html_str;
 
      }     // end load
    }
  }


// ***************************************
// 座標を確認し、"緯度経度"であれば、逆(longitude, latitude)にする
// ***************************************
function formatCordinatesToWGS84(coordinates, geom_type){

  // 逆かどうかは最初の座標で判定
  const ret_coordinates = [];
  let temp_coordinate = null;
  // let format_flg = true; // true:(longitude, latitude)
  if (geom_type.indexOf("Point") >= 0 || geom_type.indexOf("Line") >= 0){
    temp_coordinate = coordinates[0];
  }else{
    // MovingPolygon
    temp_coordinate = coordinates[0][0];
  }

  if (temp_coordinate.length == 2){
    lng = temp_coordinate[0];
    lat = temp_coordinate[1];

    // 右側の数値が90度を超えて、右側のほうが大きい場合は、"緯度経度"とみなす
    if (lat > 90 && lng < lat){
      // format_flg = false
    }else{
      // longitude, latitudeなので、そのまま返却
      return coordinates
    }
  }else{
    // 判定できなかったのでそのまま返却
    return coordinates;
  }

  // 逆(longitude, latitude)にする
  for(let i =0; i<coordinates.length; i++){
    if (geom_type.indexOf("Point") >= 0){
      // latitude, longitude ⇒ longitude, latitude
      ret_coordinates.push([coordinates[i][1], coordinates[i][0]])
    }
  }
  
  return ret_coordinates;

}


// ***************************************
// すべてのMF-JSONレイヤを対象日時相当のデータに描写
// ***************************************
function updateMfJsonLayer(dateTimeStmp, is_new){
    // 各idはdiv_nameとしている(上書きするため)
    // time_geojsons
    mf_key = Object.keys(mf_json_time_geojsons);

    mf_key.forEach(function(key){
      console.log("=======updateMfJsonLayer===========")
      const source_id = key
      const layer_id = key

      // 対象日時から最も近い（超えない）日時を取得
      closest_date = fncNearestDateStmp(Number(dateTimeStmp), date_int_list[source_id]);
      if (closest_date != null){
        console.log("closest_date", formatDate(new Date(closest_date), 'YYYY/MM/DD hh:mm'))

        // 新規か、日付が変更された場合に生成
        if (is_new == true || mf_json_closest_date == null || mf_json_closest_date !== closest_date){

          if (is_new == false && wgapp.map.getLayer(layer_id)) {
            // 更新であり、レイヤがある場合は下位にあるsetFilterのみ
            console.log("更新")
          }else{
            // 新規か入れ替わった場合
            console.log("新規")
            const geom_data = mf_json_time_geojsons[source_id]

            // すでにあれば削除
            if (wgapp.map.getSource(source_id)) {
              if (wgapp.map.getLayer(layer_id)) {
                wgapp.map.removeLayer(layer_id);
              }
              wgapp.map.removeSource( source_id );
            }

            // ソース追加
            wgapp.map.addSource(source_id, {
              type: 'geojson',
              data: geom_data,
            });

            // レイヤの可変部分
            let _type = ""
            let _paint = {}
            const geom_type = mf_json_time_geojsons[source_id]['geom_type']
            // console.log("geom_type", geom_type)
            if (geom_type.indexOf("Point") >= 0){
              _type = "circle";
              _paint = {
                "circle-color":"#c5161c"
              };
            }else if (geom_type.indexOf("Polygon") >= 0){
              _type = "fill";
              _paint = {
                "fill-color":"#c5161c"
              };
            }else if  (geom_type.indexOf("Line") >= 0){
              _type ="line";
              _paint =  {
                'line-color': "#c5161c",
                'line-width': 4 // 軌跡の線なので太くしている
              }          
            }

            // レイヤを追加
            wgapp.map.addLayer({
              'id': layer_id,
              'type': _type, 
              'source': source_id,
              'paint': _paint,
            }); 

          }
        }

        // 日時フィルター設定(常時設定)
        if (wgapp.map.getLayer(layer_id)){
          wgapp.map.setFilter(layer_id, ['==', 'datetime', closest_date]);
        }

        // mf_jsonを表示している時刻を保存（同一日時の場合は変更しない）
        mf_json_closest_date = closest_date

      }else{
        console.log("日時が範囲外");
        if (window.parent.isRangeActive() == false){
        // 存在しない日時でデータ非表示
        if (wgapp.map.getLayer(layer_id)) {
            wgapp.map.setFilter(layer_id, ['==', 'datetime', 0]);
          }
        }
      }
    });

}

// ***************************************
// 指定した値で、配列の最も近い（ただし超えない）数値を返却
// @param target_stmp:対象日時タイムスタンプ
// @param stmp_arry  :日時タイムスタンプリスト
// ***************************************
function fncNearestDateStmp (target_stmp, stmp_arry) {

  // 配列を昇順にする。（超えた時点でbreakするため）
  stmp_arry.sort(function(first, second){
    return first - second;
  });

  // 範囲外である場合はnullを返却
  if(target_stmp < stmp_arry[0] || target_stmp > stmp_arry[stmp_arry.length-1]){
    return null;
  }

  // 超えるまで確認して手前の数値を取得
  let ret_stmp = stmp_arry[0];
  for (let i = 0; i < stmp_arry.length; i++) {
      let newdiff = target_stmp - stmp_arry[i];
      if(newdiff < 0){
        break
      }
      ret_stmp = stmp_arry[i];
  }
  return ret_stmp;
}

