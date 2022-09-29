/******************************************************************************/
/* Copyright (c) NICT. All rights reserved.                                   */
/* See License.txt for the license information.                               */
/******************************************************************************/
// 実際はDBから取得すると思われる設定値


// レイアにおける色変化
const population_color_fill =  [
    'step',
    ['get', '人口'],
    '#fff5f0',200000, 
    '#fedac9'
  ];

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


const geojson_layer_metas = 
{
  'stat_area':
    [
      {
        'id': 'stat_area',
        'type': 'fill',
        'source': 'stat_area',
        'paint': {
          'fill-color': population_color_fill,
          'fill-opacity':0.7,
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
        // 'text-font':['NotoSansCJKjp-Regular'],
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
  


// // 同一ソースで複数レイアを表示するもののid
// const dual_layers = ['stat_area','population']