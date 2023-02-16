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
- 移動体データ(MF-JSON形式)


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
| 気象情報 - アメダスデータ(前処理あり) | /api/t_preprocessing_amedas_data | 指定した領域、期間に該当するデータに対し、時間粒度とリサンプル方法で処理したデータをJsonで返却<BR>引数：<BR>point_1:領域の北西の経度緯度<BR>point_2:領域の北東の経度緯度<BR>point_3:領域の南東の経度緯度<BR>point_4:領域の南西の経度緯度<BR>target_data：取得するデータテーブルのカラム名<BR>start_date：対象とする年月日時分<BR>end_date：対象とする年月日時分<BR>granularity：時間粒度<BR>proc_type：リサンプル方法<BR>center_point：地図の中心座標(再表示時のため)<BR>zoom_level：地図のズーム値(再表示時のため)<BR>pitch：地図の仰俯角度(再表示時のため)<BR>bearing：地図の回転角度(再表示時のため)|
| ３D都市モデル（東京） | /api/PLATEAU/tokyo/mvt/{z}/{x}/{y} | |
| ３D都市モデル（箱根市） | /api/PLATEAU/hakone/mvt/{z}/{x}/{y} | |
| ３D都市モデル（加賀市） | /api/PLATEAU/kaga/mvt/{z}/{x}/{y} | |
| ３D都市モデル（北九州市） | /api/PLATEAU/kitakyusyu/mvt/{z}/{x}/{y} | |
| ３D都市モデル（横須賀） | /api/PLATEAU/yokosuka/mvt/{z}/{x}/{y} | |
| 行政境界 - 市区町村境界（年数指定） | /api/jp_city/{yyyymmdd}/{z}/{x}/{y} | |
| 人口（2015年国勢調査小地域） | /api/vector-adm/tile/town/{z}/{x}/{y} | |
| DEM（geoserverデータ） | /api/geoserver/gwc/service/{z}/{x}/{y} | |
| 移動体データ | /api/t_preprocessing_garbagetruck_data |指定した領域、期間に該当するデータに対し、時間粒度とリサンプル方法で処理したデータをJsonで返却<BR>引数：<BR>point_1:領域の北西の経度緯度<BR>point_2:領域の北東の経度緯度<BR>point_3:領域の南東の経度緯度<BR>point_4:領域の南西の経度緯度<BR>target_data：取得するデータテーブルのカラム名<BR>start_date：対象とする年月日時分<BR>end_date：対象とする年月日時分<BR>granularity：時間粒度<BR>proc_type：リサンプル方法<BR>center_point：地図の中心座標(再表示時のため)<BR>zoom_level：地図のズーム値(再表示時のため)<BR>pitch：地図の仰俯角度(再表示時のため)<BR>bearing：地図の回転角度(再表示時のため)|
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
- 地図ライブラリとして、mapbox-gl(v1)「https://api.tiles.mapbox.com/mapbox-gl-js/v1.13.3/mapbox-gl.js」 を用いている。
- 点群データのレイヤ作成には、deck.gl「https://unpkg.com/deck.gl@^8.1.0/dist.min.js」 を用いている。

利用しているjavascriptファイルは複数あり、index.jsを基本とし、必要な共通変数は定義して各jsファイルで参照している。

### <BR>

### レイヤを地図に表示するまでの流れ

### 事前設定(描写するレイヤ情報)
新たにレイヤを追加する場合は、レイヤの種類に該当する内容を記載する。<BR>
下記に示す本処理用のレイヤ種類によって処理も分岐している。

ファイル：[Mapbox_map/js/layer_conf.js]

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

  - 動的なgeojsonデータを更新：同ファイル内の`readGeoJSON`関数を呼び出して更新
  - URLに日付を持つタイルのレイヤ更新：同ファイル内の`setLayerSource`関数を呼び出して更新
  - 前処理レイヤ更新：preprocess_layer.jsファイルの`updatePreproJsonLayer`関数を呼び出し、前処理レイヤを該当する日時(※１)の時系列データに更新(※２)
  - MF-JSONレイヤ更新：fileupload.jsファイルの`updateMfJsonLayer`関数を呼び出し、MF-JSONレイヤを該当する日時(※１)の時系列データに更新(※２)（
  <BR>※１ 該当する日時とは、取得した時系列データが保持している時刻で、指定時刻を超えない一番近い日時
  <BR>※２ 時系列データが保存されているレイヤを、フィルター機能を用いて該当する日時のデータのみを表示（APIによる再取得ではない）
  ```
  wgapp.map.setFilter(layer_id, ['==', 'datetime', closest_date]);
  ```

### <BR>

### 3-4. 位置情報変更に伴う処理
ファイル：Mapbox_map/js/index.js

メソッド：wgapp.map.on('moveend')

  同ファイル内の`readGeoJSON`関数とpreprocess_layer.jsファイルの`updatePreproJsonLayer`関数を呼び出し、位置情報に動的なgeojsonデータを更新<BR>
  位置情報変更で`updatePreproJsonLayer`関数があるのは、前処理ファイルを読み込み該当する位置に移動してから、ズームレベルによる大きさのレイヤを生成する必要があるため。（通常のズームレベル変更でも更新される）
  ```
  wgapp.map.on('moveend', () => {
    readGeoJSON();
    updatePreproJsonLayer(formatDate(g_current_p, 'YYYYMMDDhhmm'), true)
  });
  ```
### <BR>


### 3-5. 時系列データの前処理データ
対象となるデータテーブル、取得項目（カラム）によって異なる処理としている。

### 3-5.1 データテーブルごとのAPI名の設定
ファイル：Mapbox_map/js/index.js

  アメダス　　：t_preprocessing_amedas_data

  移動体データ：t_preprocessing_garbagetruck_data

  データテーブルの識別子(キー)を`self_prepro_source_ids`で定義し、該当するAPIを`self_api_names`で設定している。
  ```
  const self_prepro_source_ids = ['layer_amedas', 'layer_garbagetruck'];
  const self_api_names = {'layer_amedas':"t_preprocessing_amedas_data",'layer_garbagetruck':"t_preprocessing_garbagetruck_data"}; 
  ```

  APIは、「取得・表示」ボタンのメソッド `$('#btn_prepro_get_data').on('click', async function() `で呼び出している。
  

### <BR>

### 3-5.2 デフォルトスタイル

他のレイヤ設定と同様

- アメダスデータ
ファイル：Mapbox_map/json/layer_amedas.json　・・・ラベルに関しては下記「3-5.6」参照

- 移動体データ（ごみ収集車）
ファイル：Mapbox_map/json/layer_garbagetruck.json　・・・L1が車体、L2が棒グラフ、L3が数値ラベルとなる。

- 移動体データ軌跡（ごみ収集車）
ファイル：Mapbox_map/json/layer_garbagetruck_trajectory.json　・・・L1が軌跡、L2が最終日の円、L3が数値ラベルとなる。

  移動体の色は車体の取得順位（車体番号の昇順）によって振り分けている。（７つごとに繰り返す）


### <BR>

### 3-5.3 データテーブルごとの選択項目リストの設定
UIに表示する取得項目(`col_name`)は、選択したレイヤ（データテーブル）によって動的に設定している。<BR>
データベースで処理する際、`col_name`の`value`が取得するデータテーブルのカラム名になる。

ファイル：Mapbox_map/js/index.js

メソッド：  $('.data_select_box .ctrl_disabled').dblclick(function () {

例）アメダスデータの場合
  ```
    if (source_id == self_prepro_source_ids[0] ){
      // アメダス

      // カラムリスト作成
      $('#col_name').append($('<option value="precipitation24h">24時間降雨量</option>'));
      $('#col_name').append($('<option value="temp">気温</option>'));
      $('#col_name').append($('<option value="snow">積雪深</option>'));
  ```

### <BR>

### 3-5.4 APIからのデータを日時単位に変換

ファイル：Mapbox_map/js/moving_feature.js

関数： generateSingleFeatureFromApiData

　APIから取得した本システム固有形式のデータを、日時単位のGeoJson形式に変換する。<BR>
　次に、下記関数(3-5.5)で、必要な地物情報を生成する。

### <BR>

### 3-5.5 地物の生成と格納

ファイル：Mapbox_map/js/moving_feature.js

関数： generateAmedasFeatures　　　・・・アメダスデータの場合 <BR>
　　　generateMovingObjectFeatures ・・・移動体データの場合

　下記のようにデータテーブルの取得項目ごとで分岐して、数値、地物情報などを含むgeojsonデータを生成し、変数に格納している。
  ```
  例）アメダスデータ
  let data = {
    "type": "FeatureCollection",
    "features": []
  };
  <中略>

  // カラムによる数値設定
  if ("precipitation24h" in object.properties || "snow" in object.properties){
    // ********************************************
    // 24時間降雨量または積雪量
    // ********************************************
    <中略>

  }else if ("temp" in object.properties){
    // ********************************************
    // 気温
    // ********************************************
    object.properties.index = i;
    feature = object;
    <中略>
  }

  // 各地物をFeaturesに格納
  if(feature != null){
    feature.id = i;
    data.features.push(feature);
  }

  // ソースIDごとのgeojsonデータに格納
  geojson_data[self_prepro_source_ids[0]] =  data;
  ```

### <BR>

### 3-5.6 データテーブルの取得項目によるレイヤのテクスチャ（タイプ、色、高さなど）設定

ファイル：Mapbox_map/js/moving_feature.js

関数：setAmedasLayerPaint(アメダスデータの場合)

　例）アメダスデータの「気温」
  ```
    if(col_name == "temp"){
      // 気温
      layerDef["type"] = "circle";
      layerDef["paint"] =  {
        "circle-radius": 10,
        "circle-color":
          ["step",
              ["get", col_name], // カラム名のまま定義
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
  ```

### <BR>

### 3-5.7 データテーブルの取得項目による凡例の設定

ファイル：Mapbox_map/js/index.js

関数：updateLegend

- 凡例のヘッダー内容とスタイル(高さを調整したもの）は分岐している。
  ```
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
  ```

- 色と数値については、下記のようにレイヤ情報を取得して動的に生成しているので、ここで再度記載する必要はない。
  ```
      // 設定済みのレイヤ情報から凡例情報を取得
      $legend += '<div><span style="background-color: ' + _colors[_length-1] + ';"></span></div>';
      for(let i=_length-3; i>=2; i=i-2){ // i=0,1は別
        $legend += '<div><span style="background-color: ' + _colors[i] + ';"></span>' + _colors[i+1] + '</div>';
      }
  ```

### <BR>

### 3-6. MF-JSONのデータ

### 3-6-1. 読み込みとGeojson生成

ファイル：Mapbox_map/js/fileupload.js

関数：fileselectMF

- 1.画面から選択したMF-JSONファイルを読み込む。

- 2.下記のようにデータを解析して取得
  - MF-JSON形式：取得したMF-JSONの最初のキーに`temporalGeometry`がある場合
    - `temporalGeometry`の中で、位置情報を`coordinates`から、日時を`datetimes`から取得（日時は昇順であり、位置情報は日時の順番と一致している前提）
    - `temporalProperties`の各配列内の、`values`から数値を取得。（日時の順番と一致している前提）

  - Gejson形式：上記以外
    - 日時を`properties`の`datetimes`から取得
    - 各データは`properties`の各キーの値から取得（日時の順番と一致している前提）

- 3.取得したデータを、Gejson形式で一時保存する
  - レイヤのフィルター機能を用いて該当する日時を表示するため、地物の`properties`に`datetimes`として日時を追加


### 3-6-2. レイヤ生成とフィルター

ファイル：Mapbox_map/js/fileupload.js

関数：updateMfJsonLayer

- 初回ファイル読み込み後および日時変更時、下記のようにレイヤのフィルター機能を用いて、該当する日時のみのデータを表示する。

  ```
  wgapp.map.setFilter(layer_id, ['==', 'datetime', closest_date]);
  ```

### <BR>

### 3-7. Geojsonアップロード時のスタイル

ファイル：Mapbox_map/js/fileupload.js

関数：fileselect

レイヤのスタイルを該当する項目によって設定する。

例） 立体的（PLATEAUなど）の場合

  ```
  if (div_name == 'upload_5' && 'height' in feature.properties){
    // 立体的（PLATEAUなど）
    layer_type = 'fill-extrusion';
    _paint = {
      'fill-extrusion-color': "#008000",
      'fill-extrusion-height': ['get', 'height'],
    }
  ```

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


