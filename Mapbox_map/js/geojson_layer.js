/******************************************************************************/
/* Copyright (c) NICT. All rights reserved.                                   */
/* See License.txt for the license information.                               */
/******************************************************************************/

const city_name = 'tokyo';


// レイアにおける色変化
// const population_color_fill =  [
//     'step',
//     ['get', '人口'],
//     '#fedac9',0, 
//     '#fedac9'
//   ];

const population_color =  [
    'step',
    ['get', '人口'],
    '#fdccb8',100000,
    '#f44d38',150000, 
    '#f44d38',200000, 
    '#c5161c'
  ];

const population_radius = [
    'step',
    ['get', '人口'],
    12, 100000, 
    20, 200000, 
    30
];

// 表示するレイアSource
const source_jsons = [
    {
        id: 'stat_area',
        name :'市区町村',
        legend : null,
    },
    {
        id: 'population',
        name :'市区町村ごとの人口',
        legend : population_color,
        legend_unit :'人',
    },
];  

const layer_jsons2 = 
{
  'stat_area':
    [
      {
        'id': 'stat_area',
        'type': 'fill',
        'source': 'stat_area',
        'paint': {
          'fill-color': '#fedac9',
          'fill-opacity':0.5,
        },
      },
      {
        'id': 'stat_area2',
        'type': 'line',
        'source': 'stat_area',
        'paint': {
          'line-color': "#fb7050",
          'line-width': 1
        }
      }

    ],

  'population':
  [
    {
      'id': 'population',
      'type': 'circle',
      'source': 'population',
      'paint': {
        'circle-color': population_color,
        'circle-radius':population_radius,
      }
    },
    {
      'id': 'population2',
      'type': 'symbol',
      'source': 'population',
      'layout': {
        'text-field': ['concat', ['to-string', ['get', '人口']], '人'],
        'text-size': 10
        },
      'paint': {
        'text-color': 'rgba(0,0,0,0.8)'
      }
    }    
  ]
}
;
  
//*****************************関数**************************** */

/**
 * 市区町村のgeojsonファイルを取得する
 * */
async function getCityGeojson(year, city) {
    // Make a GET request to the API and return geojson.
    try {
        const response = await fetch(
            '/mapbox/Mapbox_map/geojson/' + year + '/' + city + '.geojson?date=20211201_2',
            { method: 'GET' }
            );
        return await response.json();
    } catch (err) {
       console.log(err);
        return null;
    }
}
  

/**
 * １つのgeojsonファイルから、複数の選択レイアおよび子レイアを生成
 * */
async function make_geojson_layers(geojson) {
    console.log("make_geojson_layers start")

    if (geojson != null){
        // 市区町村のポリゴンと、features情報の２つのソースを作成

        // *******************************************************
        // １．市区町村の境界ポリゴン
        wgapp.map.addSource(source_jsons[0].id, {
            type: 'geojson',
            data: geojson,
        });
        
        const layers = layer_jsons[source_jsons[0].id];
        for(addLayer of layers){
            wgapp.map.addLayer(addLayer);          
        }

        // *******************************************************
        // ２．features情報表示
        // TODO 中心の座標を取得して新たなgeojsonを生成する
        // 本実装ではDBや別のgeojsonに市区町村のメタ情報と中心座標を保持するかもしれない。
        const features = [];
        for(polygon of geojson['features']){
            const center = turf.centroid(polygon);
            center.properties = polygon.properties;
            features.push(center);
        }

        wgapp.map.addSource(source_jsons[1].id,{
            'type': 'geojson',
            'data': {
                "type": "FeatureCollection",
                "features": features
            },
        });
        const layers2 = layer_jsons[source_jsons[1].id];
        for(addLayer of layers2){
            wgapp.map.addLayer(addLayer);          
        }

        // *******************************************************
        // レイアウト表示処理(再描画も考慮)
        for(source of source_jsons){
            const menu_box = document.getElementById("menu-box" + source.id);
            const layers = layer_jsons[source.id];

            if (menu_box != null){
                if(menu_box.style == "display: flex;" || menu_box.style.cssText == "display: flex;"){
                    // 選択済みの場合
                    for(layer of layers){
                    wgapp.map.setLayoutProperty(layer.id, 'visibility', 'visible');        
                    }
                }else{
                    for(layer of layers){
                        wgapp.map.setLayoutProperty(layer.id, 'visibility', 'none');        
                    }
                }
            }else{
                for(layer of layers){
                    wgapp.map.setLayoutProperty(layer.id, 'visibility', 'none');        
                }
            }

            if (source.legend != null){
                // 凡例を生成してmapに表示
                const legend_area = document.createElement('div');

                let tempHtml = '<span class="legend-item"> [' + source.legend_unit + ']</span>';

                const len = source.legend.length;
                for(let i=2; i<len; i=i+2){
                    // 数値の最初は0で最後は空欄
                    let min = "0";
                    let max = "";
                    if(i>2){
                        min =  source.legend[i-1]
                    }
                    // if(i<len-2){
                    //     max = String(source.legend[i+1]-1);
                    // }
                    // tempHtml += '<span class="legend-item"><span class="legend-item-color" style="background:' + source.legend[i] +'"></span>' + min + ' ～ ' + max + '</span>'
                    tempHtml += '<span class="legend-item"><span class="legend-item-color" style="background:' + source.legend[i] +'"></span>' + min + ' ～ ' + '</span>'
                }

                legend_area.innerHTML = tempHtml;

                const container = document.createElement('div');
                container.id = "lg_" + source.id;
                container.className = 'legend-disable';
                container.appendChild(legend_area);

                class LegendControl {
                    onAdd(map) {
                        this.map = map;
                        return container;
                    }

                    onRemove() {
                        this.container.parentNode.removeChild(this.container);
                        this.map = undefined;
                    }
                }

                wgapp.map.addControl(new LegendControl()); // ここの位置はcssで実装している
            }
        }

        layers_info.push({"layers":source_jsons});
    }
}
