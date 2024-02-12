/******************************************************************************/
/* Copyright (c) NICT. All rights reserved.                                   */
/* See License.txt for the license information.                               */
/******************************************************************************/

// Mapboxのアクセストークン
const mapbox_accessToken = '';

// 表示レイヤ情報
vectortile_data_path = "../../storage/data/vectortile/"
etc_data_path = "./json/"
server_url = "https://tb-gis-web.jgn-x.jp/"
const const_layer_jsons = {
    '1_a_1_1_kaigansen':{ type:'vector', path:'vectortile', group: 'ac_group1_1', name: '海岸線', layer: [] },
    '1_a_1_2_kaigan_hoan':{ type:'vector', path:'vectortile', group: 'ac_group1_1', name: '海岸保全施設', layer: [] },
    '1_a_1_3_kosyou':{type:'vector', path:'vectortile', group: 'ac_group1_1', name: '湖沼', layer: [] },
    '1_a_1_5_damu':{ type:'vector', path:'vectortile', group: 'ac_group1_1', name: 'ダム', layer: [] },
    '1_a_1_6_kasen':{ type:'vector', path:'vectortile', group: 'ac_group1_1', name: '河川', layer: [] },
    '1_a_3_1_totiriyou3zi':{ type:'vector', path:'vectortile', group: 'ac_group1_3', name: '土地利用3次メッシュ', layer: [] },
    '1_a_3_2_totiriyousaibun':{ type:'vector', path:'vectortile', group: 'ac_group1_3', name: '土地利用細分メッシュ', layer: [] },
    '1_a_3_3_tositiikitotiriyou':{ type:'vector', path:'vectortile', group: 'ac_group1_3', name: '都市地域土地利用細分メッシュ', layer: [] },
    '1_a_3_4_totiriyousyousai':{ type:'vector', path:'vectortile', group: 'ac_group1_3', name: '土地利用詳細メッシュ', layer: [] },
    '1_a_4_1_hinan_sisetsu':{ type:'vector', path:'vectortile', group: 'ac_group1_4', name: '避難施設', layer: [] },
    '1_a_4_2_dosyakiken':{ type:'vector', path:'vectortile', group: 'ac_group1_4', name: '土砂災害危険個所', layer: [] },
    '1_a_4_3_kouzui':{ type:'vector', path:'vectortile', group: 'ac_group1_4', name: '洪水浸水想定区域', layer: [] },
    '1_a_4_4_heinenti':{ type:'vector', path:'vectortile', group: 'ac_group1_4', name: '平年値（気候）', layer: [] },
    '1_a_4_5_dosyanadare':{ type:'vector', path:'vectortile', group: 'ac_group1_4', name: '土砂災害・雪崩', layer: [] },
    '1_a_4_6_dosyakuiki':{ type:'vector', path:'vectortile', group: 'ac_group1_4', name: '土砂災害警戒区域', layer: [] },
    '1_a_4_7_tunami':{ type:'vector', path:'vectortile', group: 'ac_group1_4', name: '津波浸水想定', layer: [] },
    '1_a_5_1_kunikikan':{ type:'vector', path:'vectortile', group: 'ac_group1_5', name: '国・都道府県の機関', layer: [] },
    '1_a_5_3_yakuba':{ type:'vector', path:'vectortile', group: 'ac_group1_5', name: '市区町村役場', layer: [] },
    '1_a_5_2_syuukaisisetu':{ type:'vector', path:'vectortile', group: 'ac_group1_5', name: '市町村役場等及び公的集会施設', layer: [] },
    '1_a_5_4_koukyousisetu':{ type:'vector', path:'vectortile', group: 'ac_group1_5', name: '公共施設', layer: [] },
    '1_a_5_5_keisatusyo':{ type:'vector', path:'vectortile', group: 'ac_group1_5', name: '警察署', layer: [] },
    '1_a_5_6_syoubousyo':{ type:'vector', path:'vectortile', group: 'ac_group1_5', name: '消防署', layer: [] },
    '1_a_5_8_iryoukikan':{ type:'vector', path:'vectortile', group: 'ac_group1_5', name: '医療機関', layer: [] },
    '1_a_5_11_gakkou':{ type:'vector', path:'vectortile', group: 'ac_group1_5', name: '学校', layer: [] },
    '1_a_6_2_kinkyuuyusou':{ type:'vector', path:'vectortile', group: 'ac_group1_6', name: '緊急輸送道路', layer: [] },
    '1_a_6_3_mitudoentyou':{ type:'vector', path:'vectortile', group: 'ac_group1_6', name: '道路密度・道路延長メッシュ', layer: [] },
    '1_a_6_6_tetsudo':{ type:'vector', path:'vectortile', group: 'ac_group1_6', name: '鉄道', layer: [] },
    'wni':{ type:'raster', path:'etc_2', group: 'ac_group2', name: '高解像度降水NC【時系列】', layer: [] },
    'amjp_veda02_sshfs_wnd':{ type:'raster', path:'etc_2', group: 'ac_group2', name: '風向・風速【時系列】', layer: [] },
    'amjp_veda02_sshfs_tsfc':{ type:'raster', path:'etc_2', group: 'ac_group2', name: '地表面気温【時系列】', layer: [] },
    'amjp_veda02_sshfs_rh.sfc':{ type:'raster', path:'etc_2', group: 'ac_group2', name: '地表面湿度【時系列】', layer: [] },
    'amjp':{ type:'raster', path:'etc_2', group: 'ac_group2', name: '日射量【時系列】', layer: [] },
    //'rmap':{ type:'raster', path:'etc_1', group: 'ac_group2', name: '水位', layer: [] },
    'h8jp':{ type:'raster', path:'etc_2', group: 'ac_group2', name: 'ひまわり【時系列】', layer: [] },
    'layer_amedas':{ type:'geojson', path:'geojson2', group: 'ac_group2', name: 'アメダス', layer: [] },
    'layer_city_boundary':{ type:'vector', path:'etc_2', group: 'ac_group4', name: '行政境界（市区町村・複数年）', layer: [] },
    'layer_town':{ type:'vector', path:'etc_2', group: 'ac_group4', name: '行政境界（町丁目・2015年固定）', layer: [] },
    'bargraph_source':{ type:'poppointcloud', path:'poppointcloud', group: 'ac_group4', name: '人口（市区町村・複数年）', layer: ["extrusion_population","extrusion_households","extrusion_housing"] },
    'layer_town_color':{ type:'vector', path:'etc_2', group: 'ac_group4', name: '人口（町丁目・2015年固定）', layer: [] },
    'layer_dem':{ type:'raster', path:'etc_1', group: 'ac_group5', name: 'DEM', layer: [] },
    'layer_plateau_tokyo':{ type:'vector', path:'etc_1', group: 'ac_group3', name: '３D都市モデル（東京）', layer: [] },
    'layer_plateau_hakone':{ type:'vector', path:'etc_1', group: 'ac_group3', name: '３D都市モデル（箱根市）', layer: [] },
    'layer_plateau_kaga':{ type:'vector', path:'etc_1', group: 'ac_group3', name: '３D都市モデル（加賀市）', layer: [] },
    'layer_plateau_kitakyusyu':{ type:'vector', path:'etc_1', group: 'ac_group3', name: '３D都市モデル（北九州）', layer: [] },
    'layer_plateau_yokosuka':{ type:'vector', path:'etc_1', group: 'ac_group3', name: '３D都市モデル（横須賀）', layer: [] },
    'layer_garbagetruck':{ type:'geojson', path:'geojson2', group: 'ac_group6', name: '移動体データ（ごみ収集車ー日進市）', layer: [] },
    'layer_garbagetruck_trajectory':{ type:'geojson', path:'geojson2', group: 'ac_group6', name: '移動体データ軌跡（同上）', layer: [] },
    'layer_jinryu':{ type:'geojson', path:'geojson2', group: 'ac_group6', name: '人流（GPS）', layer: [] },
    'layer_bus':{ type:'geojson', path:'geojson2', group: 'ac_group6', name: 'バス', layer: [] },
    'point_cloud':{ type:'pointcloud', path:'pointcloud', group: 'ac_group6', name: '点群データ', layer: ["point_cloud"] },
    'polygon_cloud':{ type:'polygoncloud', path:'polygoncloud', group: 'ac_group6', name: '面群データ', layer: ["polygon_cloud"] },
}

let group_list = {
    'ac_group1_1': [] ,
    'ac_group1_3': [] ,
    'ac_group1_4': [] ,
    'ac_group1_5': [] ,
    'ac_group1_6': [] ,
    'ac_group2': [],
    'ac_group3': [],
    'ac_group4': [],
    'ac_group5': [],
    'ac_group6': []
}
