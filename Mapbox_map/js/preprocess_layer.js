/**
 * 前処理のメソッドおよび関数
 */


// ダウンロードのための保持情報(dl_col_nameは共通利用あり)
let dl_source_id = "";
let dl_col_name = "";
let dl_granularity = "";
let dl_proc_type = "";
let dl_start_date = "";
let dl_end_date = "";


/**
 * 時間粒度変更
 */
$("#proc_type").change(function(){
  // 項目を変更したのでDL不可
  $("#btn_prepro_download").prop('disabled', true);

  // 時間粒度の再設定
  setGranularity($("#granularity").val());
});


function setGranularity(_pre_gr){
  if (_pre_gr == null){
    _pre_gr = "1hour"; // エラー回避のため
  }

  const gr_list = ["sec", "minute", "hour" ,"day", "month", "year"]
  let selected_gr = "";
  let gr_val = "";

  // 数値以外の切り出し
  for(let i=0; i<gr_list.length; i++){
    if(_pre_gr.indexOf(gr_list[i]) != -1){
      selected_gr = gr_list[i];
      gr_val = _pre_gr.replace(selected_gr,"")
      break;
    }
  }

  if(selected_gr == null || selected_gr == ""){
    selected_gr = $("#granularity").val();
  }

  console.log("----------setGranularity selected_gr", selected_gr)

  $('#granularity').children().remove(); // いったんすべて削除

  if ($("#prepro_db_data_type").val() == self_prepro_source_ids[0]){
    // アメダス
    if ($('#proc_type').val() == "avg" || $('#proc_type').val() == "max" || $('#proc_type').val() == "min"){
      // 集約
      $('#granularity').append($('<option value="minute">分</option>'));
      $('#granularity').append($('<option value="hour">時間</option>'));
      $('#granularity').append($('<option value="day">日</option>'));
      $('#granularity').append($('<option value="month">月</option>'));
      $('#granularity').append($('<option value="year">年</option>'));

      if (selected_gr == "sec"){
        selected_gr = "minute"
      }

    }else{
      // 補間
      $('#granularity').append($('<option value="sec">秒</option>'));
      $('#granularity').append($('<option value="minute">分</option>'));

      if (selected_gr != "sec" && selected_gr != "minute"){
        selected_gr = "sec"
      }
    }

  }else{
    // 移動体データ
    if ($('#proc_type').val() == "avg" || $('#proc_type').val() == "max" || $('#proc_type').val() == "min"){
      // 集約
      $('#granularity').append($('<option value="minute">分</option>'));
      $('#granularity').append($('<option value="hour" >時間</option>'));
      $('#granularity').append($('<option value="day">日</option>'));
      $('#granularity').append($('<option value="month">月</option>'));
      $('#granularity').append($('<option value="year">年</option>'));

      if (selected_gr == "sec"){
        selected_gr = "minute"
      }

    }else{
      // 補間
      $('#granularity').append($('<option value="sec" >秒</option>'));
      selected_gr = "sec";
      // $('#granularity').append($('<option value="minute">分</option>'));
      // $('#granularity').append($('<option value="hour">時間</option>'));
      // $('#granularity').append($('<option value="day">日</option>'));
    }

  }

  // 時間粒度数値設定
  if (gr_val == null || gr_val == ""){
    gr_val = $("#granularity_val").val();
    if (gr_val == null || gr_val == ""){
      gr_val = 1;
    }
  }
  $("#granularity_val").val(gr_val)
  $("#granularity").val(selected_gr)

}

/**
 * 時間粒度単位変更
 */
$("#granularity").change(function(){
  const gr = $("#granularity").val();

  // 項目を変更したのでDL不可
  $("#btn_prepro_download").prop('disabled', true);

  if (gr == "hour"){
    if($("#granularity_val").val() > 24){
      $("#granularity_val").val(1);
    }
  }
});

/**
 * 時間粒度変更
 */
$("#granularity_val").change(function(){
  // 項目を変更したのでDL不可
  $("#btn_prepro_download").prop('disabled', true);
});

// 期間変更
$("#start_date").change(function(){
  // 項目を変更したのでDL不可
  $("#btn_prepro_download").prop('disabled', true);
});
$("#end_date").change(function(){
  // 項目を変更したのでDL不可
  $("#btn_prepro_download").prop('disabled', true);
});


/**
 * データ取得実行
 */
$('#btn_prepro_get_data').on('click', async function() {

  // 日付の必須チェックはする(submitではないので、requiredは使用できない)
  if($("#start_date").val() == ""){
    alert("期間(開始)を入力してください。")
    return
  }
  if($("#end_date").val() == ""){
    alert("期間(終了)を入力してください。")
    return
  }

  // パラメータの取得
  const _start_date = formatDate(new Date($("#start_date").val()), 'YYYYMMDDhhmm');
  const _end_date = formatDate(new Date($("#end_date").val()), 'YYYYMMDDhhmm');

  if (_start_date > _end_date){
    alert("期間(終了)は開始より先を選択してください。")
    return
  }

  let col_name = $("#col_name").val();
  let granularity = $("#granularity").val();
  const granularity2 = $("#granularity").val();

  if ($("#granularity_val").val() != null && $("#granularity_val").val() != 1){
    granularity = $("#granularity_val").val() + granularity
  }

  const proc_type = $("#proc_type").val();
  const center = wgapp.map.getCenter()
  let lng,lat = null;
  if(center != undefined){
    lng = center['lng'];
    lat = center['lat'];
  }

  // API名の取得
  const source_id = $("#prepro_db_data_type").val();
  const api_name = self_api_names[source_id]

  // let all_flg_path = ""
  // if (all_feature_flg == true){
  //   all_flg_path = "&json_type=all" // すべてを一つのGeoJsonで取得（日時はプロパティ内）
  // }

  const path =  API_URL + "/" + api_name
  + "?point_1=" + point_1 + "&point_2=" + point_2 + "&point_3=" + point_3 + "&point_4=" + point_4 
  + "&start_date=" + _start_date 
  + "&end_date=" + _end_date 
  + "&target_data=" + col_name
  + "&granularity=" + granularity
  + "&proc_type=" + proc_type
  + "&center_point=" + lng + "," + lat
  + "&zoom_level=" +wgapp.map.getZoom()
  + "&bearing=" + wgapp.map.getBearing()
  + "&pitch=" + wgapp.map.getPitch()
  // + all_flg_path 
  ;

  try{
    // 連打防止
    $("#btn_prepro_get_data").prop('disabled', true);

    // ************************************
    // 取得開始
    // ************************************
    const response = await fetch(path);

    if (response.ok) {
      // ************************************
      // 一時保存
      // ************************************
      const temp_response_json =  await response.json();

      prepro_date_int_list[source_id] = [];

      const prepro_keys = Object.keys(temp_response_json);
      let error_flg = false;
      prepro_keys.forEach(function(_json_key){

        // if (toString.call(formatToDateFromYYYYMMDDHHMISS(_json_key)).indexOf("Date") > 0){
        //   // 日付キーであれば格納
        //   if (String(_json_key).length == 12){
        //     prepro_date_int_list[source_id].push(String(_json_key) + "00") // 秒(ss)を追加
          
        //   }else{
        //     prepro_date_int_list[source_id].push(String(_json_key))
        //   }

        if (_json_key == "data_array" &&  temp_response_json["data_array"][0] != undefined){
          // ************************************
          // 日付を取得
          // ************************************

          // タイムゾーン変換
          const timezone = temp_response_json["data_array"][0]["features"][0]["properties"]["timezone"];
          console.log("-------timezone", timezone)
          if(timezone != undefined && timezone != null && timezone != "None"){
            const datetime_list = JSON.parse(JSON.stringify(temp_response_json["data_array"][0]["features"][0]["properties"]["datetime"]));

            for(let i=0; i<datetime_list.length; i++){
              const date_tz = formatToDateFromYYYYMMDDHHMISS(datetime_list[i])
              date_tz.setHours( date_tz.getHours() + 9);
              prepro_date_int_list[source_id].push(formatDate(date_tz, 'YYYYMMDDhhmmss'));
            }
          }else{
            // 格納されている配列のまま(ディープコピーは必要)
            prepro_date_int_list[source_id] = JSON.parse(JSON.stringify(temp_response_json["data_array"][0]["features"][0]["properties"]["datetime"]));
          }

          // 他の個体で不足があれば追加
          for(let i=1; i<temp_response_json["data_array"].length; i++){
            const _datetimes = JSON.parse(JSON.stringify(temp_response_json["data_array"][i]["features"][0]["properties"]["datetime"]));

            for(let j=0; j<_datetimes.length; j++){
              let _datetime = _datetimes[j];

              // タイムゾーン変換
              if(timezone != undefined && timezone != null && timezone != "None"){
                const date_tz = formatToDateFromYYYYMMDDHHMISS(_datetime)
                date_tz.setHours( date_tz.getHours() + 9);
                _datetime = formatDate(date_tz, 'YYYYMMDDhhmmss')
              }

              if (prepro_date_int_list[source_id].indexOf(_datetime) == -1){
                prepro_date_int_list[source_id].push(_datetime);
              }
            }
          }
        }else if(_json_key == "error"){
            alert("データ取得時にエラーが発生しました。\r\n【" +  temp_response_json["error"] + "】")
            error_flg = true;
            return;
        }

        // 昇順にソート
        prepro_date_int_list[source_id].sort(function(first, second){
          return first - second;
        });

      });

      if(error_flg == true){
        return;
      }

      // console.log("prepro_date_int_list:", prepro_date_int_list[source_id])
      // ダウンロード用に格納
      dl_source_id = $("#prepro_db_data_type").val();
      dl_col_name = $("#col_name").val();
      // dl_granularity_val = $("#granularity_val").val()
      dl_granularity = String($("#granularity_val").val()) + $("#granularity").val();
      dl_proc_type = $("#proc_type").val();
      dl_start_date = _start_date
      dl_end_date = _end_date

  
      if (prepro_date_int_list[source_id].length > 0){
        // エラー判定後に格納
        prepro_response_geojsons[source_id]  = temp_response_json;

        const str_startTime = prepro_date_int_list[source_id][0];

        // 時刻範囲設定
        let range_startTime = formatToDateFromYYYYMMDDHHMISS(str_startTime);
        let range_endTime = null;
        if (prepro_date_int_list[source_id].length > 1){
          const str_endTime = prepro_date_int_list[source_id][prepro_date_int_list[source_id].length-1];
          range_endTime = formatToDateFromYYYYMMDDHHMISS(str_endTime);
        }else{
          // １時刻だった場合は終了日時を開始日時の時間粒度単位＋１に設定する
          const str_endTime = str_startTime;
          range_endTime = formatToDateFromYYYYMMDDHHMISS(str_endTime);

          if (granularity2 == "sec"){
            range_endTime.setSeconds(range_endTime.getSeconds() + 1);
          }else if (granularity2 == "minute"){
            range_endTime.setMinutes(range_endTime.getMinutes() + 1);
          }else if (granularity2 == "hour"){
            range_endTime.setHours(range_endTime.getHours() + 1);
          }else if (granularity2 == "day"){
            range_endTime.setDate(range_endTime.getDate() + 1);
          }else if (granularity2 == "month"){
            range_endTime.setMonth(range_endTime.getMonth() + 1);
          }else if (granularity2 == "year"){
            range_endTime.setFullYear(range_endTime.getFullYear() + 1);
          }else{
            // エラー回避のため＋１時間
            range_endTime.setHours(range_endTime.getHours() + 1);
          }
        }

        // 開始終了が反転していれば逆にする
        if (range_startTime > range_endTime){
          console.log("range_startTime > range_endTime")
          const temp = new Date(range_startTime.getTime());
          range_startTime = new Date(range_endTime.getTime());
          range_endTime = temp;
        }

        // ***********************************
        // レンジバー設定
        // ***********************************
        window.parent.fncSetRange(range_startTime.getTime(), range_endTime.getTime());

        // ダウンロードボタン有効
        $("#btn_prepro_download").prop('disabled', false);

        // すでにアップロードしていたらファイル名をクリア（表示とvalue)
        let result_inner = document.getElementById('prepro_file_name');
        result_inner.innerHTML = "Geojsonアップロード(復元)";

        let fileinput = document.getElementById('prepro_fileinput');
        fileinput.value = "";

        // ***********************************
        // レイヤ作成
        // およびデータがある範囲の開始日時を指定する
        // ***********************************
        updatePreproJsonLayer(formatDate(range_startTime, 'YYYYMMDDhhmmss'), true);
  
      }else{
        alert("対象データがありませんでした。")
      }

    } else {
      console.log("HTTP-Error: " + response.status);
      alert("データ取得時にエラーが発生しました。\r\n【" +  "HTTP-Error: " + response.status + "】")
      return null;
    }

  } catch(err) {
    console.log("in try", err);
    alert("データ取得時にエラーが発生しました。\r\n【" +  err + "】")
    return null;

  } finally{
    // 連打防止解除
    $("#btn_prepro_get_data").prop('disabled', false);

  }
});


/**
 * ***************************************
 * 前処理データ（時系列データ）レイヤを対象日時相当のデータに描画
 * @param {*} dateTimeNum 
 * @param {*} is_new 
 * ***************************************
 */
function updatePreproJsonLayer(dateTimeNum, is_new){

  console.log("updatePreproJsonLayer dateTimeNum", dateTimeNum)
  amedass_flg = 1; // APIのアメダスデータは取得しないようにする

  for(let i=0;i<self_prepro_source_ids.length;i++){
    const source_id = self_prepro_source_ids[i];
    const layer_id = source_id + '_L1'

    if(prepro_date_int_list[source_id] == undefined || prepro_date_int_list[source_id].length <= 0){
      continue;
    }

    // ***********************************
    // 対象日時から最も近い（超えない）日時を取得
    // ***********************************
    console.log(prepro_date_int_list[source_id]);
    closest_date = fncNearestDateStmp(Number(dateTimeNum), prepro_date_int_list[source_id]);
    console.log("closest_date", closest_date)
    if (closest_date === undefined){
      continue;

    }else if (closest_date === null){
      console.log("日時が範囲外");
      if (window.parent.isRangeActive() == false){
        // 範囲設定が無効の場合(範囲指定していれば、クリアはしない（自動的に範囲内に戻るため）)
        if (wgapp.map.getSource(source_id)) {
          // 存在しない日時でデータ非表示
          if (wgapp.map.getLayer(self_prepro_source_ids[i] + "_L1")){
            wgapp.map.setFilter(self_prepro_source_ids[i] + "_L1", ['==', 'datetime', '99999999']);
          }
          if (wgapp.map.getLayer(self_prepro_source_ids[i] + "_L2")){
            wgapp.map.setFilter(self_prepro_source_ids[i] + "_L2", ['==', 'datetime', '99999999']);
          }
          if (wgapp.map.getLayer(self_prepro_source_ids[i] + "_L3")){
            wgapp.map.setFilter(self_prepro_source_ids[i] + "_L3", ['==', 'datetime', '99999999']);
          }
        }
      }
      continue;

    }

    if (is_new == true){
      // ***********************************
      // 新規の場合
      // ***********************************

      // APIから取得したものを取得
      const geom_data = prepro_response_geojsons[source_id];
      if (geom_data == undefined){
        console.log("geom_data is undefined");
        continue
      }

      // レイアウト用に格納(取得したJSONの参照ではなくDEEPコピー)
      // geojson_data[source_id] =  JSON.parse(JSON.stringify(geom_data));
      geojson_data[source_id] =  JSON.parse(JSON.stringify(geom_data["data_array"]));

      // APIから取得した日時キーのデータを全件のGeoJsonにする
      // generateGeoJsonFromDateKey(source_id);
      generateSingleFeatureFromApiData(source_id);

      // レイヤ追加
      setPreproGeojsonLayerSource(layer_id, source_id);

      // 凡例更新
      updateLegend();

    }else{
      // 何もしない
    }

    // ***********************************************
    // 日時フィルター設定(常時設定)
    //  ・移動体通常データは、日時単位で車体と棒グラフの２つの地物があり、height2の有効値で判断する。
    //  ・移動体軌跡の内部保持データは、日時単位でLineStringとPointの２つの地物があり、plot_type(1：点）で判別する。
    //  　　　(線のときに「plot_type != 1」を指定しないと、線の各点にも円が表示される)
    // ***********************************************
    const filter_car = ["all",["==", 'datetime', closest_date], ["==", 'height2', -1]];
    const filter_bar = ["all",["==", 'datetime', closest_date], [">", 'height2', -1]];
    const filter_line = ["all",["==", 'datetime', closest_date], ["!=", 'plot_type', 1]];
    const filter_circle = ["all",["==", 'datetime', closest_date], ["==", 'plot_type', 1]];

    for (let i=0;i<self_prepro_source_ids.length;i++){
      // L1
      if (wgapp.map.getLayer(self_prepro_source_ids[i] + "_L1")){
        if (i == 1){
          // 移動体（通常：車体）
          wgapp.map.setFilter(self_prepro_source_ids[i] + "_L1", filter_car);
        }else if (i == 2){
          // 移動体（軌跡：線）
          wgapp.map.setFilter(self_prepro_source_ids[i] + "_L1", filter_line);
        }else{
          // 上記以外
          wgapp.map.setFilter(self_prepro_source_ids[i] + "_L1", ['==', 'datetime', closest_date]);
        }
      }

      // L2
      if (wgapp.map.getLayer(self_prepro_source_ids[i] + "_L2")){
        if (i == 1){
          // 移動体（通常：棒グラフ）
          wgapp.map.setFilter(self_prepro_source_ids[i] + "_L2", filter_bar);
        }else if (i == 2){
          // 移動体（軌跡：最終円）
          wgapp.map.setFilter(self_prepro_source_ids[i] + "_L2", filter_circle);
        }else{
          // 上記以外
          wgapp.map.setFilter(self_prepro_source_ids[i] + "_L2", ['==', 'datetime', closest_date]);
        }
      }

      // L3(主にテキスト)
      if (wgapp.map.getLayer(self_prepro_source_ids[i] + "_L3")){
        if (i == 1){
          // 移動体（通常：棒グラフ）
          wgapp.map.setFilter(self_prepro_source_ids[i] + "_L3", filter_bar);
        }else if (i == 2){
          // 移動体（軌跡：最終円）
          wgapp.map.setFilter(self_prepro_source_ids[i] + "_L3", filter_circle);
        }else{
          // 上記以外
          wgapp.map.setFilter(self_prepro_source_ids[i] + "_L3", ['==', 'datetime', closest_date]);
        }
      }

    }
 
  }

}

/**
 * 指定したidのレイヤを再度追加する
 * @param {*} layer_id 
 * @param {*} source_id 
 */
function setPreproGeojsonLayerSource (layer_id, source_id) {
  console.log("setPreproGeojsonLayerSource start")

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
      if (wgapp.map.getLayer(source_id + "_L3")) {
        wgapp.map.removeLayer(source_id + "_L3");
      }
      wgapp.map.removeSource( source_id );
    }

    // **********************************
    // ソース追加
    // **********************************
    wgapp.map.addSource(
      source_id, {
        type : "geojson",
        data : geojson_data[source_id]
      }
    );

    // **********************************
    // レイヤ追加
    // **********************************
    if(layerDef != null){

      // 前処理（時系列）レイヤの場合は個別設定する
      if(source_id == self_prepro_source_ids[0]){
        // L1 再追加
        // layerDefに選択した種類のpaintを設定
        wgapp.map.addLayer(setAmedasLayerPaint(layerDef), before_layerid);

        // L2 テキストレイヤ（観測所）
        setAmedasTextLayer();

      }else if (source_id == self_prepro_source_ids[3]) {
        // L1 再追加
        if (wgapp.map.getLayer(before_layerid)) {
          wgapp.map.addLayer(layerDef, before_layerid);
        }else{
          wgapp.map.addLayer(layerDef);
        }

      }else{
        // L1 再追加
        if (wgapp.map.getLayer(before_layerid)) {
          wgapp.map.addLayer(layerDef, before_layerid);
        }else{
          wgapp.map.addLayer(layerDef);
        }

        const layer_id_2 = source_id + "_L2"
        const layerIndex2 = _layers.findIndex(l => l.id === layer_id_2);
        const layerDef2 = _layers[layerIndex2];
        const before_layerid2 = _layers[layerIndex2 + 1] && _layers[layerIndex2 + 1].id;

        if (wgapp.map.getLayer(before_layerid2)) {
          wgapp.map.addLayer(layerDef2, before_layerid2);
        }else{
          wgapp.map.addLayer(layerDef2);
        }

        const layer_id_3 = source_id + "_L3"
        const layerIndex3 = _layers.findIndex(l => l.id === layer_id_3);
        const layerDef3 = _layers[layerIndex3];
        const before_layerid3 = _layers[layerIndex3 + 1] && _layers[layerIndex3 + 1].id;

        if (wgapp.map.getLayer(before_layerid3)) {
          wgapp.map.addLayer(layerDef3, before_layerid3);
        }else{
          wgapp.map.addLayer(layerDef3);
        }

      }
    }

  } catch(err) {
    console.log(err);
  }

  console.log("setPreproGeojsonLayerSource end")
}


/**
 * ***************************************
 * 結果ダウンロード（取得時点のデータと地図情報）
 * ***************************************
 */
$('#btn_prepro_download').on('click',function(){
  // ソースの識別子を追加する
  prepro_response_geojsons[dl_source_id]['source_id'] = dl_source_id

  // JSONをBlobインスタンスにする
  const blob = new Blob([JSON.stringify(prepro_response_geojsons[dl_source_id], null, '  ')], {type: 'application\/json'});

  let file_size = Math.round((blob.size/1024) * 10) / 10;
  let size_unit ="K"

  if(file_size > 100){
    file_size = Math.round((file_size/1024) * 10) / 10;
    size_unit ="M"
  }
  const ret = window.confirm('取得したデータをダウンロードします。ファイルサイズは約【' + file_size + size_unit + 'バイト】です。\r\nダウンロードを開始しますか。');

  if(ret == true){
    const url = window.URL.createObjectURL(blob);

    const a = document.getElementById('downloader');

    let file_name = "";
    if (dl_source_id == "layer_amedas"){
      file_name = "amedas_";
    }else{
      file_name = "moving_";
    }

    a.download = file_name + dl_col_name + '_' + dl_proc_type + '_' + dl_granularity + '_' + dl_start_date + '-' + dl_end_date + '.json';
    a.href = url;

    // ダウンロードリンクをクリックする
    $('#downloader')[0].click();
  }
  
});


/**
 * ***************************************
 * 前処理のファイルデータ読込
 * ***************************************
 */
function fileselectPrepro(e){
  console.log("fileselectPrepro start")

  const inputFileList = document.querySelector('#'+e.id).files;
  const source_id = $("#prepro_db_data_type").val();

  if(inputFileList.length !== 0) {
    let inputFile = inputFileList[0] // ファイルは単一前提

    // 読み込み(onload)
    const reader = new FileReader(inputFile);
    reader.readAsText(inputFile);
    reader.onload = function(e){
      // JSONとして認識させる
      let geojson_obj = reader.result.replace(/[\n\r]/g,""); 
      const geojson_eval = eval("(" + geojson_obj + ")");

      // 保存していた前処理データを更新
      prepro_response_geojsons[source_id] = geojson_eval;

      // 復元データ取得
      const json_source_id = prepro_response_geojsons[source_id]['source_id']

      if (source_id.includes(json_source_id) == false && json_source_id.includes(source_id) == false){
        console.log("ファイルデータが適切ではありません。 json_source_id【" + json_source_id + "】")
        let result_inner = document.getElementById('prepro_file_name');
        result_inner.innerHTML = "ファイルデータが適切ではありません。";        

        let fileinput = document.getElementById('prepro_fileinput');
        fileinput.value = "";
        return
      }

      // 前処理ダイヤログ用
      const col_name = prepro_response_geojsons[source_id]["target_data"];
      dl_col_name = col_name; // 地図移動時に利用する変数に格納
      const _start_date = prepro_response_geojsons[source_id]["start_date"];
      const _end_date = prepro_response_geojsons[source_id]["end_date"];
      const granularity = prepro_response_geojsons[source_id]["granularity"];
      const proc_type = prepro_response_geojsons[source_id]["proc_type"];

      // 地図上の情報
      let map_center = null;
      let map_zoom = null;
      let map_pitch = null;
      let map_bearing = null;
      if (prepro_response_geojsons[source_id]["map_center"] != undefined){
        map_center = prepro_response_geojsons[source_id]["map_center"].split(",");
      }
      if (prepro_response_geojsons[source_id]["map_zoom"] != undefined){
        map_zoom = prepro_response_geojsons[source_id]["map_zoom"];
      }
      if (prepro_response_geojsons[source_id]["map_pitch"] != undefined){
        map_pitch = prepro_response_geojsons[source_id]["map_pitch"];
      }
      if (prepro_response_geojsons[source_id]["map_bearing"] != undefined){
        map_bearing = prepro_response_geojsons[source_id]["map_bearing"];
      }

      // 時刻キーも更新
      prepro_date_int_list[source_id] = [];
      const prepro_keys = Object.keys(prepro_response_geojsons[source_id]);
      prepro_keys.forEach(function(_json_key){
        // if (toString.call(formatToDateFromYYYYMMDDHHMISS(_json_key)).indexOf("Date") > 0){
        //   // 日付キーであれば格納
        //   prepro_date_int_list[source_id].push(String(_json_key))
        // }else if(_json_key == "datetimes"){
        //   // datetimesがあれば日時キーにする
        //   prepro_date_int_list[source_id] = prepro_response_geojsons[source_id][_json_key]
        // }        
        if (_json_key == "data_array" &&  prepro_response_geojsons[source_id]["data_array"][0] != undefined){
          // ************************************
          // 日付を取得
          // ************************************

          // タイムゾーン変換
          const timezone = prepro_response_geojsons[source_id]["data_array"][0]["features"][0]["properties"]["timezone"];
          console.log("-------timezone", timezone)
          if(timezone != undefined && timezone != null && timezone != "None"){
            const datetime_list = prepro_response_geojsons[source_id]["data_array"][0]["features"][0]["properties"]["datetime"];

            for(let i=0; i<datetime_list.length; i++){
              const date_tz = formatToDateFromYYYYMMDDHHMISS(datetime_list[i])
              date_tz.setHours( date_tz.getHours() + 9);
              prepro_date_int_list[source_id].push(formatDate(date_tz, 'YYYYMMDDhhmmss'));
            }
          }else{
            // 格納されている配列のまま
            prepro_date_int_list[source_id] = prepro_response_geojsons[source_id]["data_array"][0]["features"][0]["properties"]["datetime"];
          }
          
          // 他の個体で不足があれば追加
          for(let i=1; i<prepro_response_geojsons[source_id]["data_array"].length; i++){
            let _datetimes = prepro_response_geojsons[source_id]["data_array"][i]["features"][0]["properties"]["datetime"];

            for(let j=0; j<_datetimes.length; j++){
              let _datetime = _datetimes[j];

              // タイムゾーン変換
              if(timezone != undefined && timezone != null && timezone != "None"){
                const date_tz = formatToDateFromYYYYMMDDHHMISS(_datetime)
                date_tz.setHours( date_tz.getHours() + 9);
                _datetime = formatDate(date_tz, 'YYYYMMDDhhmmss')
              }
  
              if (prepro_date_int_list[source_id].indexOf(_datetime) == -1){
                prepro_date_int_list[source_id].push(_datetime);
              }
            }
          }
        }
      });

      // 昇順にソート
      prepro_date_int_list[source_id].sort(function(first, second){
        return first - second;
      });
    
      // ダイヤログ(UI)とタイムスライダーの反映および地図の移動
      if (prepro_date_int_list[source_id].length > 0){

        // レイヤ描写は移動後にreadGeoJONで処理する
        // 時刻範囲設定(prepro_date_int_listは日付のみ格納されている)
        const str_startTime = prepro_date_int_list[source_id][0]
        const str_endTime = prepro_date_int_list[source_id][prepro_date_int_list[source_id].length-1]
        const range_startTime = formatToDateFromYYYYMMDDHHMISS(str_startTime);
        const range_endTime = formatToDateFromYYYYMMDDHHMISS(str_endTime);

        if (prepro_date_int_list[source_id].length >= 2){
          // ２時刻以上がある場合に範囲設定
          // レンジバー設定
          window.parent.fncSetRange(range_startTime.getTime(), range_endTime.getTime());
        }

        // 画面に反映
        $("#col_name").val(col_name);

        // 期間が未指定でも、データの開始日、終了日としておく
        if(_start_date != undefined){
          const start_time = formatDate(formatToDateFromYYYYMMDDHHMISS(_start_date), 'YYYY-MM-DDThh:mm:ss')
          $("#start_date").val(start_time);
        }else{
          const start_time = formatDate(range_startTime, 'YYYY-MM-DDThh:mm:ss')
          $("#start_date").val(start_time);
        }

        if(_end_date != undefined){
          const end_time = formatDate(formatToDateFromYYYYMMDDHHMISS(_end_date), 'YYYY-MM-DDThh:mm:ss')
          $("#end_date").val(end_time);
        }else{
          const end_time = formatDate(range_endTime, 'YYYY-MM-DDThh:mm:ss')
          $("#end_date").val(end_time);
        }

        $("#proc_type").val(proc_type);
        setGranularity(granularity)
        // $("#granularity").val(granularity);

        let result_inner = document.getElementById('prepro_file_name');
        result_inner.innerHTML = inputFile.name;

        // 地図移動
        // 読み込み時はファイルに記載されている内容
        if (map_bearing != null){
          wgapp.map.setBearing(Number(map_bearing))
        }
        if (map_pitch != null){
          wgapp.map.setPitch(Number(map_pitch))
        }
        if (map_center != null && map_zoom != null){
          // prepro_move_flg = true;
          wgapp.map.flyTo({
            center: map_center,
            zoom: map_zoom,
          });
        }

        // ダウンロードボタン無効
        $("#btn_prepro_download").prop('disabled', true);
  
      }else{
        alert("対象データがありませんでした。")
      }

    };

  }

}

// // 地物の表示形式変更
// $("#view_type").change(function(){

//   // 地物を作成しなおす
//   const source_id = $("#prepro_db_data_type").val();

//   if(wgapp.map.getSource(source_id)){

//     // データを取得
//     // const geom_data = prepro_response_geojsons[source_id];
//     const geom_data = prepro_response_geojsons[source_id]["data_array"];
//     // レイアウト用の変数に格納(取得したJSONの参照ではなくDEEPコピー)
//     geojson_data[source_id] =  JSON.parse(JSON.stringify(geom_data));

//     // GeoJsonにする
//     // generateGeoJsonFromDateKey(source_id);
//     generateSingleFeatureFromApiData(source_id);
  
//     // レイヤソースをsetData
//     wgapp.map.getSource(source_id).setData(geojson_data[source_id]);
  
//     // 該当する日付を表示
//     // updatePreproJsonLayer(formatDate(g_current_p, 'YYYYMMDDhhmm'), false)
//     updatePreproJsonLayer(formatDate(g_current_p, 'YYYYMMDDhhmmss'), false)
  
//   }
// });

// 地物の大きさ変更
$("#feature_size").change(function(){

  // 地物を作成しなおす
  const source_id = $("#prepro_db_data_type").val();

  if(wgapp.map.getSource(source_id)){

    // データを取得
    const geom_data = prepro_response_geojsons[source_id]["data_array"];
    // レイアウト用の変数に格納(取得したJSONの参照ではなくDEEPコピー)
    geojson_data[source_id] =  JSON.parse(JSON.stringify(geom_data));

    // GeoJsonにする
    generateSingleFeatureFromApiData(source_id);
  
    // レイヤソースをsetData
    wgapp.map.getSource(source_id).setData(geojson_data[source_id]);

    // 該当する日付を表示
    updatePreproJsonLayer(formatDate(g_current_p, 'YYYYMMDDhhmmss'), false)
  
  }
});


// ダイヤログを閉じる
$('#btn_prepro_close').on('click', async function() {

  $("#prepro_controller").addClass("hidden");

  if ( $("#prepro_db_data_type").val() == self_prepro_source_ids[0]){
    // 取得していなければアメダス通常表示
    if (prepro_date_int_list[self_prepro_source_ids[0]].length == 0){
      amedass_flg = 0;
      readGeoJSON();
    }
  }

});


/**
 * ***************************************
 * 日付文字列からDate型に変換
 * ***************************************
 */
function formatToDateFromYYYYMMDDHHMISS(str_date){

  if (str_date.length == 12){
    return new Date(str_date.substring(0,4), str_date.substring(4,6)-1, str_date.substring(6,8), str_date.substring(8,10), str_date.substring(10,12));
  }else if (str_date.length == 14){
    return new Date(str_date.substring(0,4), str_date.substring(4,6)-1, str_date.substring(6,8), str_date.substring(8,10), str_date.substring(10,12), str_date.substring(12,14));
  }else{
    return str_date
  }
}
