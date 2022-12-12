# TemplateWebGIS_Mapbox
Mapboxを用いたデータ分析・可視化WebGISアプリ  

## 概要
MapboxをベースとしたWebGISアプリ向けデータ可視化機能を活用して、対象の時系列データを可視化するWebGISアプリケーションです。   
可視化の対象は以下のデータです。
- 国土交通省国土数値情報
- 降雨データ
- 気象データ
- 国土地理院が提供する地理院タイルのベースマップ
- OpenStreetMap（OSM）の地図タイルデータ
- 国土交通省PLATEAUによる3次元建物データ
- 行政境界データ（町丁目・市区町村・都道府県）
- 人口情報


利用している機能は以下の通りです。
- Timeline
- ViewURL
- 時空間同期機能
- 立体グラフ表示機能
- 3次元オブジェクト表示機能
- 画像キャプチャ機能
- 面群表示機能
- 点群表示機能
- レイヤー間相対位置判定機能

## <BR>

## 本システムの活用方法について
- 認証
- 地図情報取得(API一覧)
- レイヤの描写
- タイムラインライブラリ

<!-- ############################################################################## -->
### 1. 認証
本システムではユーザ認証にAuth0サービスを利用している。<BR>
※現時点では、Auth0の設定で、本システムのサーバー以外からログイン画面は表示できない

- 設定内容

  auth_config.jsonに記載
  - domain　 : auth0上の本システムのドメイン名
  - audience : APIで認証するのためのURL
  - clientId : auth0上の本システムのアプリケーションID

- ログインおよび認証処理
下記にファイルごとに関連する内容を記載する

  #### index.html
  画面全体のヘッダーにログインボタンを含めて記述

  #### js/app.js
  ログイン、ログアウト(ユーザ認証可否による処理の割り振り)
  - login関数：ログイン処理（ログインボタンから呼び出される）

    Auth0のログイン画面を表示させる
    ```
    await auth0.loginWithRedirect(options);
    ```

  - configureClient関数

    設定ファイルの記載内容からauth0のインスタンスを生成
    ```
        auth0 = new Auth0Client({
          domain: config.domain,
          audience : config.audience,
          client_id: config.clientId,
        });
    ```

  - window.onload:

    上記configureClient関数を呼び出し、認証されていれば、js/ui.jsのupdateUI関数を呼び出して認証結果を保存する。


  #### js/ui.js
  updateUI関数：ユーザ認証関連の処理
  - ユーザ認証処理
    auth0の認証処理を実行する。
    ```
    const isAuthenticated = await auth0.isAuthenticated();
    ```
    ⇒結果(isAuthenticated)がTrueであれば認証されたことを示す

  - ユーザ情報取得

    ログイン者のユーザ情報を取得し、画面にユーザ名を表示する。
    ```
    user = await auth0.getUser();
    ```

  - アクセストークンを取得

    ※このaccessTokenが、地図上の各種レイヤのタイルまたはデータにおいて、
    本システムのサーバーから取得するための認証アクセストークンとして使用される。

    ```
    accessToken = await auth0.getTokenSilently();
    document.getElementById("map").contentWindow.accessToken = accessToken; 
    ```

  - 左メニューの表示・非表示

    認証された場合のみ、左メニュー（レイヤ選択欄）を表示する。
    ```
    if (accessToken != ""){
      $('#map').contents().find('#side-menu').show();
    } else {
      $('#map').contents().find('#side-menu').hide();
    }
    ```

- 地図側
 下記「3.レイヤの描写手順 -> 地図処理 -> 1. 初期処理」参照
### <BR>

<!-- ############################################################################## -->
### 2.地図情報の取得
  - サーバー側の設定については、システム構築説明書.pdfを参照
  - 本システムで提供しているAPI一覧表

|  内容  |  取得URL  |　備考
| ---- | ---- |---- |
| 海岸線 |  /api/data/vectortile/1_a_1_1_kaigansen/{year}/{z}/{x}/{y}  ||
| 海岸保全施設  |  /api/data/vectortile/1_a_1_2_kaigan_hoan/{year}/{z}/{x}/{y}  ||
| 湖沼 |  /api/data/vectortile/1_a_1_3_kosyou/{year}/{z}/{x}/{y}  ||
| ダム |  /api/data/vectortile/1_a_1_5_damu/{year}/{z}/{x}/{y}  ||
| 河川 |  /api/data/vectortile/1_a_1_6_kasen/{year}/{z}/{x}/{y}  ||
| 土地利用3次メッシュ |  /api/data/vectortile/1_a_3_1_totiriyou3zi/{year}/{z}/{x}/{y}  | |
| 土地利用細分メッシュ |  /api/data/vectortile/1_a_3_2_totiriyousaibun/{year}/{z}/{x}/{y}  | |
| 都市地域土地利用細分メッシュ |  /api/data/vectortile/1_a_3_3_tositiikitotiriyou/{year}/{z}/{x}/{y}  | |
| 土地利用詳細メッシュ | /api/data/vectortile/1_a_3_4_totiriyousyousai/{year}/{z}/{x}/{y} | |
| 避難施設 | /api/data/vectortile/1_a_4_1_hinan_sisetsu/{year}/{z}/{x}/{y} | |
| 土砂災害危険個所 | /api/data/vectortile/1_a_4_2_dosyakiken/{year}/{z}/{x}/{y} | |
| 洪水浸水想定区域 | /api/data/vectortile/1_a_4_3_kouzui/{year}/{z}/{x}/{y} | |
| 平年値（気候） | /api/data/vectortile/1_a_4_4_heinenti/{year}/{z}/{x}/{y} | |
| 土砂災害・雪崩 | /api/data/vectortile/1_a_4_5_dosyanadare/{year}/{z}/{x}/{y} | |
| 土砂災害警戒区域 | /api/data/vectortile/1_a_4_6_dosyakuiki/{year}/{z}/{x}/{y} | |
| 津波浸水想定 | /api/data/vectortile/1_a_4_7_tunami/{year}/{z}/{x}/{y} | |
| 国・都道府県の機関 | /api/data/vectortile/1_a_5_1_kunikikan/{year}/{z}/{x}/{y} | |
| 市区町村役場 | /api/data/vectortile/1_a_5_3_yakuba/{year}/{z}/{x}/{y} | |
| 市町村役場等及び公的集会施設 | /api/data/vectortile/1_a_5_2_syuukaisisetu/{year}/{z}/{x}/{y} | |
| 公共施設 | /api/data/vectortile/1_a_5_4_koukyousisetu/{year}/{z}/{x}/{y} | |
| 警察署 | /api/data/vectortile/1_a_5_5_keisatusyo/{year}/{z}/{x}/{y} | |
| 消防署 | /api/data/vectortile/1_a_5_6_syoubousyo/{year}/{z}/{x}/{y} | |
| 医療機関 | /api/data/vectortile/1_a_5_8_iryoukikan/{year}/{z}/{x}/{y} | |
| 学校 | /api/data/vectortile/1_a_5_11_gakkou/{year}/{z}/{x}/{y} | |
| 緊急輸送道路 | /api/data/vectortile/1_a_6_2_kinkyuuyusou/{year}/{z}/{x}/{y} | |
| 道路密度・道路延長メッシュ | /api/data/vectortile/1_a_6_3_mitudoentyou/{year}/{z}/{x}/{y} | |
| 鉄道 | /api/data/vectortile/1_a_6_6_tetsudo/{year}/{z}/{x}/{y} | |
| 気象情報 - 高解像度降水ナウキャスト  |  /api/weather_wni/wni/{yyyymmdd}/{hhmm}/{z}/{x}/{y}  | |
| 気象情報 - 風向風速  |  /api/weather_amjp_veda02_sshfs/wnd/{yyyy}/{mm}/{dd}/{hh}/{mi}/{z}/{x}/{y}  | |
| 気象情報 - 地表面気温  |  /api/weather_amjp_veda02_sshfs/tsfc/{yyyy}/{mm}/{dd}/{hh}/{mi}/{z}/{x}/{y}  | |
| 気象情報 - 地表面湿度  |  /api/weather_amjp_veda02_sshfs/rh.sfc/{yyyy}/{mm}/{dd}/{hh}/{mi}/{z}/{x}/{y}  | |
| 気象情報 - 日射量 | /api/weather/amjp/{yyyy}/{mm}/{dd}/{hh}/{mi}/{z}/{x}/{y} | |
| 気象情報 - ひまわり | /api/weather/h8jp/{yyyy}/{mm}/{dd}/{hh}/{mi}/{z}/{x}/{y} | |
| 気象情報 - 水位 | /api/weatherrmap/{z}/{x}/{y} | |
| 気象情報 - アメダスデータ | /api/t_amedas_data | 指定した領域、日時に該当するデータをGeoJsonで返却<BR>引数：<BR>point_1:領域の北西の経度緯度<BR>point_2:領域の北東の経度緯度<BR>point_3:領域の南東の経度緯度<BR>point_4:領域の南西の経度緯度<BR>currentDate:対象日付・時刻(YYYYMMDDHH24MI)|
| ３D都市モデル（東京） | /api/PLATEAU/tokyo/mvt/{z}/{x}/{y} | |
| ３D都市モデル（箱根市） | /api/PLATEAU/hakone/mvt/{z}/{x}/{y} | |
| ３D都市モデル（加賀市） | /api/PLATEAU/kaga/mvt/{z}/{x}/{y} | |
| ３D都市モデル（北九州市） | /api/PLATEAU/kitakyusyu/mvt/{z}/{x}/{y} | |
| ３D都市モデル（横須賀） | /api/PLATEAU/yokosuka/mvt/{z}/{x}/{y} | |
| 行政境界 - 市区町村境界（年数指定） | /api/jp_city/{yyyymmdd}/{z}/{x}/{y} | |
| 人口（2015年国勢調査小地域） | /api/vector-adm/tile/town/{z}/{x}/{y} | |
| DEM（geoserverデータ） | /api/geoserver/gwc/service/{z}/{x}/{y} | |
| 人流データ | /api/t_people_flow_data |指定した領域、日時、装置IDに該当するデータをGeoJsonで返却<BR>引数：<BR>point_1:領域の北西の経度緯度<BR>point_2:領域の北東の経度緯度<BR>point_3:領域の南東の経度緯度<BR>point_4:領域の南西の経度緯度<BR>currentDate:対象日付・時刻(YYYYMMDDHH24MISS *DD以下は省略可能)<BR>device:対象とする子機デバイスID|
| 人流データの存在日付取得 | /api/t_people_exist_date | |
| 地理院地図（バイナリベクタタイル） | /api/std/experimental_bvmap/{z}/{x}/{y} | |
| WebAPI_地理院タイル（淡色） | /api/pale/{z}/{x}/{y} | |
| WebAPI_地理院タイル（標準） | /api/std/{z}/{x}/{y} | |
| WebAPI_地理院タイル（航空写真）| /api/photo/{z}/{x}/{y} | |
| OpenStreatMap（バイナリベクタタイル） | /api/osmv/data/japan/{z}/{x}/{y} | |
| OpenStreatMap（ラスタタイル） | /api/osmr/styles/osm-bright-ja/{z}/{x}/{y} | |
| タイルメタ情報取得 | /api/t_tile_meta_data | |
### <BR>

<!-- ############################################################################## -->
### 3.レイヤの描写
- 地図ライブラリとして、mapbox-gl(v1)「https://api.tiles.mapbox.com/mapbox-gl-js/v1.13.2/mapbox-gl.js」 を用いている。
- 点群データのレイヤ作成には、deck.gl「https://unpkg.com/deck.gl@^8.1.0/dist.min.js」 を用いている。
### <BR>

### レイヤを地図に表示するまでの流れ

### 事前設定(描写するレイヤ情報)
新たにレイヤを追加する場合は、レイヤの種類に該当する内容を記載する。<BR>
下記に示す本処理用のレイヤ種類によって処理も分岐している。

ファイル：Mapbox_map/js/layer_conf.js

  - 構成
    - キー：レイヤソースID
    - type：レイヤタイプ(vector, raster, geojson, pointcloud, polygoncloud)<BR>
            　　　　　　※vector, raster, geojsonはmapboxで定義されているもの
    - path：本処理用のレイヤ種類
      - vectortile   : 本システムのサーバー上にスタイルJSONがあり、日付なしのベクトルタイルレイヤ
      - etc_1        : Mapbox_map/json配下にスタイルJSONがあり、日付なしのベクトルタイルレイヤ
      - etc_2        : Mapbox_map/json配下にスタイルJSONがあり、タイルのURLパスに動的な日付を持つレイヤ
      - geojson      : Mapbox_map/json配下にスタイルJSONがあり、動的なgeojsonデータから描写するレイヤ（人流データなど）
      - geojson2     : Mapbox_map/json配下にスタイルJSONがあり、geojsonファイルから描写するレイヤ
      - poppointcloud：人口データによる３次元棒グラフレイヤ
      - pointcloud   ：点群データのレイヤ
      - polygoncloud : 面群データのレイヤ
    - group：画面のレイヤ欄に表示するためのグループ名
      - ac_group1_1 : 地理空間情報 水域
      - ac_group1_3 : 地理空間情報 土地利用
      - ac_group1_4 : 地理空間情報 災害防災
      - ac_group1_5 : 地理空間情報 施設
      - ac_group1_6 : 地理空間情報 交通
      - ac_group2   : 気象情報データベース
      - ac_group3   : ３次元建物
      - ac_group4   : 行政境界
      - ac_group5   : DEM
      - ac_group6   : センサデータ
    - name：画面に表示するレイヤ名
    - layer：レイヤ情報を格納する配列（初期は空配列で、該当するスタイルJSONから格納)

  #### ※ レイヤ追加方法（３パターン）

  - タイルのURLが本システムのサーバー以外にあり、日付を持たないベクトルタイル
    - layer_conf.jsに本処理用のレイヤ種類(path)は`etc_1`を記載して追加
    - タイルのURLやレイヤスタイルが記載されたスタイルJSONファイルを本Webアプリケーション配下のMapbox_map/jsonに配置

  - タイルのURLが本システムのサーバー以外にあり、日付を持つベクトルタイル
    - layer_conf.jsに本処理用のレイヤ種類(path)は`etc_2`を記載して追加
    - タイルのURLやレイヤスタイルが記載されたスタイルJSONファイルを本Webアプリケーション配下のMapbox_map/jsonに配置

  - 固定のgeojsonデータ
    - layer_conf.jsに本処理用のレイヤ種類(path)は`geojson2`を記載して追加
    - geojsonファイルのパスやレイヤスタイルが記載されたスタイルJSONファイルを、本Webアプリケーション配下のMapbox_map/jsonに配置
    - geojsonファイルを配置（本Webアプリケーション配下の場合、Mapbox_map以下の相対パス）

### <BR>


<!-- ############################################################################## -->
### 3-1. 初期処理

ファイル：Mapbox_map/js/index.js

mapboxのアクセストークンを格納
```
mapboxgl.accessToken = mapbox_accessToken;
```

基盤地図のスタイルJSONのパスや表示位置などを設定し、mapboxgl.Mapオブジェクトを生成
```
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
```

※transformRequestは、本システムのサーバーのタイルを取得するための認証方法であり、

変数`accessToken`については、下記「認証方法 -> ログインおよび認証処理 -> js/ui.js」の「アクセストークンを取得」参照



### <BR>
### 3-2. レイヤを描写
ラスタレイヤ、API経由でデータベースにアクセスして取得する動的データのGeoJsonレイヤ、<BR>
日付によってパス（URL）がことなるベクトルタイルレイヤ、CSVなどのデータによるレイヤなど、種類によって処理が分かれている。<BR>

ファイル：Mapbox_map/js/index.js

メソッド：wgapp.map.on("load")（地図のロード後）

設定したレイヤ情報から該当するレイヤを描写する
- layer_conf.jsに記載されているレイヤ情報から、下記の方法で該当するスタイルJSON(sources,layers)を取得し、各レイヤを作成

    1. 同ファイル内の`readGeoJSON`関数を呼び出し、動的なgeojsonデータを取得

    2. 同ファイル内の`make_layers`関数を呼び出し、レイヤを作成
    - make_layersの内容

      - 本処理用のレイヤ種類(path)が[vectortile]の場合、レイヤソースIDに該当するJSONファイルを読み込み、スタイルJSONとして設定する<BR>
        タイルURLは、「"api/data/vectortile/" + source_id + "/latest/{z}/{x}/{y}.pbf"」になる。
        
      - 本処理用のレイヤ種類が[etc_1,etc_2,geojson]の場合、フォルダ「Mapbox_map/json」配下に該当するJSONファイルを読み込み、スタイルJSONとして設定する。<BR>
      layer_conf.jsのキーと、スタイルJSONのファイル名と、レイヤのsourcesのキーは一致する必要がある。 <BR>
      geojsonの場合、`data`に上記で格納したgeojsonデータを設定する。

      - 本処理用のレイヤ種類が上記以外の場合、該当するcsvまたはjsonファイルをデータとし、deck.glによるレイヤ描写をする。
    
    - スタイルJSON例（水位：rmap.json）
      ※下記sourcesのキー（rmap）は、ファイル名（拡張子は含めない）と同一にする
    
      ```
      {
        "sources": {
          "rmap": {
            "type": "raster",
            "tiles": ["/api/weatherrmap/{z}/{x}/{y}.png"]
          }
        },
        "layers": [
          {
            "id": "rmap1",
            "name" : "水位",
            "type": "raster",
            "source": "rmap",
            "minzoom": 1,
            "maxzoom": 10			
          }
        ]
      }
      ```

- 選択状態によって表示・非表示を設定
- 表示対象であれば透明度を設定
#### <BR>

### 3-3. レイヤの更新処理
ファイル：Mapbox_map/js/index.js

関数：layer_update
  - 引数：更新日時
  - 同ファイル内の`readGeoJSON`関数を呼び出し、動的なgeojsonデータを更新
  - 同ファイル内の`setLayerSource`関数を呼び出し、URLに日付を持つタイルのレイヤ更新
### <BR>

### 3-4. 位置情報変更に伴う処理
ファイル：Mapbox_map/js/index.js
メソッド：wgapp.map.on('moveend')

  同ファイル内の`readGeoJSON`関数を呼び出し、位置情報にも動的なgeojsonデータを更新
  ```
  wgapp.map.on('moveend', () => {
    readGeoJSON();
  });
  ```
### <BR>


### 3-5. 各処理詳細
レイヤデータ更新処理などについては、別途readme[readme_mapbox_detail]を参照
### <BR>


<!-- ############################################################################## -->
### 4.時間（日時）表示と同期

### 時間軸バー表示のライブラリTimelineについて
- 参照元URL：http://k2go.jp/public/Timeline/
  - ボタン操作による処理については上記参照
  
- 本システム上のファイルパス：timeline/1.8.0/jquery-k2go-timeline.js

- 本システムにおける処理
  - k2goTimelineのコンストラクタを作成し、`timeChange`（日時が変更される度に呼び出されるコールバック関数）で、地図側のレイアウト更新関数に表示日時を渡す
  - js/main.js
    ```
    $("#timeline").k2goTimeline(
    {
      // 他の記載は省略
      timeChange       : function(pTimeInfo)
      {
        var $current_p = pTimeInfo.currentTime; 

        //URL書き換え
        const url = new URL(location);
        url.searchParams.set("dt", formatDate($current_p, 'YYYYMMDDhhmm'));

        // 地図を更新（変更時刻のデータに更新）
        var fileName = formatDate($current_p, 'YYYYMMDD_hhmmss') + ".jpg"  // 連続画面キャプチャのファイル名
        iframe = document.getElementById("map");
        iframe.contentWindow.layer_update(fileName,$current_p);
      }
    });
    ```
    `layer_update`関数は、上記「3-3. レイヤの更新処理」に参照

### 時間・位置の同期
- 参照元URL：http://k2go.jp/public/STARS/controller/
- 本システム上のファイルパス：js/STARScontroller.js

  - STARScontroller_getDate：STARScontrollerが本システムの現在日時情報を取得するため定期的にコールしている。

    上記ライブラリのセレクタ`k2goTimeline`のgetOptionsから日時（表示日時、開始日時、終了日時）を取得して返却
    ```
    var objOptions = $("#timeline").k2goTimeline("getOptions");
    var objTimeInfo = {};
    
    objTimeInfo.currentDate = objOptions.currentTime;
    objTimeInfo.startDate   = objOptions.startTime;
    objTimeInfo.endDate     = objOptions.endTime;

    return objTimeInfo;
    ```

  - STARScontroller_setDate：STARScontrollerが本システムの現在日時を同期させる際にコールしている。
    本システムでは、上記ライブラリのセレクタ`k2goTimeline`のcreateメソッドにて日時を再描写、再設定している。
    ```
    $("#timeline").k2goTimeline("create", {
      timeInfo :
      {
        minTime     : objTimeInfo.minTime,
        maxTime     : objTimeInfo.maxTime,
        startTime   : objTimeInfo.startTime,
        endTime     : objTimeInfo.endTime,
        currentTime : objTimeInfo.currentTime
      },
      callback : function(pTimeInfo)
      {
        adjustRangeBar();
        $Env.creating = false;
        $("#lockWindow").removeClass("show");
      }
    });
    ```

  - STARScontroller_getPosition：STARScontrollerが本システムの現在位置情報を取得するため定期的にコールしている。

    セレクタ`map`の地図情報から、中央・領域の位置およびズームレベルとカメラアングルを取得する。。
    ```
    var pMap = $('#map')[0].contentWindow.getMap();

    var objCenter = pMap.getCenter();
    var objBounds = pMap.getBounds();
    var objResult = {center:{lat:0, lng:0}};

    if (objCenter && objBounds) {
      var objSouthWest = objBounds.getSouthWest();
      var objNorthEast = objBounds.getNorthEast();

      objResult.center.lat = objCenter.lat;
      objResult.center.lng = objCenter.lng;

      objResult.north      = objNorthEast.lat;
      objResult.east       = objNorthEast.lng;
      objResult.south      = objSouthWest.lat;
      objResult.west       = objSouthWest.lng;

      objResult.zoom       = pMap.getZoom();
      objResult.direction  = pMap.getBearing();
      objResult.pitch      = pMap.getPitch();

      return objResult;
    } else {
      return null;
    }
    ```

  - STARScontroller_setPosition：STARScontrollerがWebアプリケーションの現在位置を同期させる際にコールしている。
    ```
    $('#map')[0].contentWindow.setPosition(pPosition);
    ```


