<template>
  <div class="map-container">
    <el-row :gutter="20">
      <!-- 左侧地图区域 -->
      <el-col :span="24">
        <el-card class="map-card" shadow="hover">
          <div class="map-header">
            <h1 class="map-title">{{ isWorldMap ? '全球北辰使者分布' : '中国北辰使者分布' }}</h1>
            <div class="evangelist-count" v-if="isWorldMap">共{{ totalEvangelists }}位北辰使者</div>
          </div>
          <div v-if="!isWorldMap" class="back-btn-wrapper">
            <el-button type="primary" size="small" @click="backToWorldMap" class="back-btn">
              返回世界地图
            </el-button>
          </div>
          <div ref="mapChart" class="map-chart">
            <div v-if="loading" class="loading">加载地图中...</div>
          </div>
          <div class="map-tip" v-if="!showEvangelists">
            <i class="el-icon-cursor" style="margin-right: 5px;"></i>
            点击地图上彩色区域查看北辰使者信息
          </div>
        </el-card>
      </el-col>
    </el-row>
    <!-- 北辰使者列表，传递选中的区域/城市信息，点击地图后才显示 -->
    <Evangelists 
      v-if="showEvangelists" 
      :selected-area="selectedArea" 
      :selected-city="selectedCity"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useRouter } from 'vue-router'
import { getProvinceMapData, getEvangelistCount } from '@/data/evangelists'
import { evangelists, cityToProvince } from '@/data/evangelists'
import worldJson from '@/assets/maps/world.json'
import chinaJson from '@/assets/maps/china.json'
import Evangelists from './Evangelists.vue'

// 添加国家名称映射
const countryNameMap = {
  'Afghanistan': '阿富汗',
  'Albania': '阿尔巴尼亚',
  'Algeria': '阿尔及利亚',
  'Andorra': '安道尔',
  'Angola': '安哥拉',
  'Antigua and Barbuda': '安提瓜和巴布达',
  'Argentina': '阿根廷',
  'Armenia': '亚美尼亚',
  'Australia': '澳大利亚',
  'Austria': '奥地利',
  'Azerbaijan': '阿塞拜疆',
  'Bahamas': '巴哈马',
  'Bahrain': '巴林',
  'Bangladesh': '孟加拉国',
  'Barbados': '巴巴多斯',
  'Belarus': '白俄罗斯',
  'Belgium': '比利时',
  'Belize': '伯利兹',
  'Benin': '贝宁',
  'Bhutan': '不丹',
  'Bolivia': '玻利维亚',
  'Bosnia and Herzegovina': '波斯尼亚和黑塞哥维那',
  'Botswana': '博茨瓦纳',
  'Brazil': '巴西',
  'Brunei': '文莱',
  'Bulgaria': '保加利亚',
  'Burkina Faso': '布基纳法索',
  'Burundi': '布隆迪',
  'Cambodia': '柬埔寨',
  'Cameroon': '喀麦隆',
  'Canada': '加拿大',
  'Cape Verde': '佛得角',
  'Central African Republic': '中非共和国',
  'Chad': '乍得',
  'Chile': '智利',
  'China': '中国',
  'Colombia': '哥伦比亚',
  'Comoros': '科摩罗',
  'Congo': '刚果',
  'Costa Rica': '哥斯达黎加',
  'Croatia': '克罗地亚',
  'Cuba': '古巴',
  'Cyprus': '塞浦路斯',
  'Czech Republic': '捷克',
  'Denmark': '丹麦',
  'Djibouti': '吉布提',
  'Dominica': '多米尼克',
  'Dominican Republic': '多米尼加共和国',
  'Ecuador': '厄瓜多尔',
  'Egypt': '埃及',
  'El Salvador': '萨尔瓦多',
  'Equatorial Guinea': '赤道几内亚',
  'Eritrea': '厄立特里亚',
  'Estonia': '爱沙尼亚',
  'Ethiopia': '埃塞俄比亚',
  'Fiji': '斐济',
  'Finland': '芬兰',
  'France': '法国',
  'Gabon': '加蓬',
  'Gambia': '冈比亚',
  'Georgia': '格鲁吉亚',
  'Germany': '德国',
  'Ghana': '加纳',
  'Greece': '希腊',
  'Grenada': '格林纳达',
  'Guatemala': '危地马拉',
  'Guinea': '几内亚',
  'Guinea-Bissau': '几内亚比绍',
  'Guyana': '圭亚那',
  'Haiti': '海地',
  'Honduras': '洪都拉斯',
  'Hungary': '匈牙利',
  'Iceland': '冰岛',
  'India': '印度',
  'Indonesia': '印度尼西亚',
  'Iran': '伊朗',
  'Iraq': '伊拉克',
  'Ireland': '爱尔兰',
  'Israel': '以色列',
  'Italy': '意大利',
  'Jamaica': '牙买加',
  'Japan': '日本',
  'Jordan': '约旦',
  'Kazakhstan': '哈萨克斯坦',
  'Kenya': '肯尼亚',
  'Kiribati': '基里巴斯',
  'Korea': '韩国',
  'Kuwait': '科威特',
  'Kyrgyzstan': '吉尔吉斯斯坦',
  'Laos': '老挝',
  'Latvia': '拉脱维亚',
  'Lebanon': '黎巴嫩',
  'Lesotho': '莱索托',
  'Liberia': '利比里亚',
  'Libya': '利比亚',
  'Liechtenstein': '列支敦士登',
  'Lithuania': '立陶宛',
  'Luxembourg': '卢森堡',
  'Macedonia': '马其顿',
  'Madagascar': '马达加斯加',
  'Malawi': '马拉维',
  'Malaysia': '马来西亚',
  'Maldives': '马尔代夫',
  'Mali': '马里',
  'Malta': '马耳他',
  'Marshall Islands': '马绍尔群岛',
  'Mauritania': '毛里塔尼亚',
  'Mauritius': '毛里求斯',
  'Mexico': '墨西哥',
  'Micronesia': '密克罗尼西亚',
  'Moldova': '摩尔多瓦',
  'Monaco': '摩纳哥',
  'Mongolia': '蒙古',
  'Montenegro': '黑山',
  'Morocco': '摩洛哥',
  'Mozambique': '莫桑比克',
  'Myanmar': '缅甸',
  'Namibia': '纳米比亚',
  'Nauru': '瑙鲁',
  'Nepal': '尼泊尔',
  'Netherlands': '荷兰',
  'New Zealand': '新西兰',
  'Nicaragua': '尼加拉瓜',
  'Niger': '尼日尔',
  'Nigeria': '尼日利亚',
  'Norway': '挪威',
  'Oman': '阿曼',
  'Pakistan': '巴基斯坦',
  'Palau': '帕劳',
  'Palestine': '巴勒斯坦',
  'Panama': '巴拿马',
  'Papua New Guinea': '巴布亚新几内亚',
  'Paraguay': '巴拉圭',
  'Peru': '秘鲁',
  'Philippines': '菲律宾',
  'Poland': '波兰',
  'Portugal': '葡萄牙',
  'Qatar': '卡塔尔',
  'Romania': '罗马尼亚',
  'Russia': '俄罗斯',
  'Rwanda': '卢旺达',
  'Saint Kitts and Nevis': '圣基茨和尼维斯',
  'Saint Lucia': '圣卢西亚',
  'Saint Vincent and the Grenadines': '圣文森特和格林纳丁斯',
  'Samoa': '萨摩亚',
  'San Marino': '圣马力诺',
  'Sao Tome and Principe': '圣多美和普林西比',
  'Saudi Arabia': '沙特阿拉伯',
  'Senegal': '塞内加尔',
  'Serbia': '塞尔维亚',
  'Seychelles': '塞舌尔',
  'Sierra Leone': '塞拉利昂',
  'Singapore': '新加坡',
  'Slovakia': '斯洛伐克',
  'Slovenia': '斯洛文尼亚',
  'Solomon Islands': '所罗门群岛',
  'Somalia': '索马里',
  'South Africa': '南非',
  'South Sudan': '南苏丹',
  'Spain': '西班牙',
  'Sri Lanka': '斯里兰卡',
  'Sudan': '苏丹',
  'Suriname': '苏里南',
  'Swaziland': '斯威士兰',
  'Sweden': '瑞典',
  'Switzerland': '瑞士',
  'Syria': '叙利亚',
  'Taiwan': '台湾',
  'Tajikistan': '塔吉克斯坦',
  'Tanzania': '坦桑尼亚',
  'Thailand': '泰国',
  'Timor-Leste': '东帝汶',
  'Togo': '多哥',
  'Tonga': '汤加',
  'Trinidad and Tobago': '特立尼达和多巴哥',
  'Tunisia': '突尼斯',
  'Turkey': '土耳其',
  'Turkmenistan': '土库曼斯坦',
  'Tuvalu': '图瓦卢',
  'Uganda': '乌干达',
  'Ukraine': '乌克兰',
  'United Arab Emirates': '阿联酋',
  'United Kingdom': '英国',
  'United States': '美国',
  'Uruguay': '乌拉圭',
  'Uzbekistan': '乌兹别克斯坦',
  'Vanuatu': '瓦努阿图',
  'Vatican City': '梵蒂冈',
  'Venezuela': '委内瑞拉',
  'Vietnam': '越南',
  'Yemen': '也门',
  'Zambia': '赞比亚',
  'Zimbabwe': '津巴布韦',
  'South Korea': '韩国',
  'North Korea': '朝鲜',
  'South Africa': '南非',
  'North Africa': '北非',
  'South America': '南美洲',
  'North America': '北美洲',
  'United States of America': '美国',
  'Greenland': '格陵兰',
  'Antarctica': '南极洲',
  'Australia': '澳大利亚',
  'New Caledonia': '新喀里多尼亚',
  'New Zealand': '新西兰',
  'Papua New Guinea': '巴布亚新几内亚',
  'Republic of Serbia': '塞尔维亚',
  
  // 兜底：所有未覆盖的国家名都返回自身
}

const mapChart = ref(null)
let chart = null
const selectedArea = ref(null)
const selectedCity = ref(null)
const router = useRouter()
const loading = ref(true)
const isWorldMap = ref(true)
// 控制使者列表显示的状态
const showEvangelists = ref(false)
// 获取使者总数
const totalEvangelists = computed(() => getEvangelistCount())

// 修改地图数据加载方式
const loadMapData = async () => {
  try {
    console.log('开始加载地图数据...')
    // 注册世界地图
    echarts.registerMap('world', worldJson)
    // 注册中国地图
    echarts.registerMap('china', chinaJson)
    console.log('地图注册成功')
    await initMap()
  } catch (error) {
    console.error('加载地图数据失败:', error)
    loading.value = false
  }
}

const initMap = async () => {
  if (!mapChart.value) {
    console.error('地图容器不存在')
    return
  }

  try {
    console.log('初始化地图...')
    const mapData = getProvinceMapData(isWorldMap.value)
    console.log('地图数据:', mapData)
    const totalEvangelists = getEvangelistCount()
    const maxValue = Math.max(...mapData.map(item => item.value), 1)

    const option = {
      backgroundColor: '#fff',
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          const value = params.value || 0
          const name = isWorldMap.value ? (countryNameMap[params.name] || params.name) : params.name
          
          // 世界地图显示使者数量，中国地图只显示名称
          if (isWorldMap.value) {
            return value > 0 ? `${name}: ${value} 位北辰使者` : `${name}`
          } else {
            return `${name}`
          }
        }
      },
      visualMap: {
        show: false,  // 隐藏视觉映射组件
        min: 0,
        max: maxValue,
        inRange: {
          color: ['#e6f7ff', '#1890ff']
        }
      },
      series: [
        {
          name: '北辰使者数量',
          type: 'map',
          map: isWorldMap.value ? 'world' : 'china',
          roam: true,
          zoom: isWorldMap.value ? 1.5 : 2.0,
          center: isWorldMap.value ? [105, 35] : [105, 36],
          emphasis: {
            label: {
              show: true,
              color: '#fff',
              fontSize: 16
            },
            itemStyle: {
              areaColor: '#40a9ff',
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          data: mapData,
          label: {
            show: true,  // 显示标签
            color: '#333',
            fontSize: 14,
            formatter: function(params) {
              const value = params.value || 0
              const name = isWorldMap.value ? (countryNameMap[params.name] || params.name) : params.name
              
              // 世界地图仅显示有北辰使者的区域名称，中国地图显示所有区域名称
              if (isWorldMap.value) {
                return value > 0 ? `${name}` : ''
              } else {
                return `${name}`
              }
            }
          },
          itemStyle: {
            areaColor: '#e6f7ff',  // 默认颜色
            borderColor: '#fff',
            borderWidth: 1,
            shadowBlur: 5,
            shadowColor: 'rgba(0, 0, 0, 0.1)'
          },
          select: {
            itemStyle: {
              areaColor: '#1890ff'  // 选中时的颜色
            },
            label: {
              color: '#fff'
            }
          }
        }
      ]
    }

    // 确保在设置选项之前等待DOM更新
    await nextTick()
    
    if (chart) {
      chart.dispose()
    }
    
    // 确保地图容器已经准备好
    if (!mapChart.value) {
      console.error('地图容器在 nextTick 后仍然不存在')
      return
    }
    
    chart = echarts.init(mapChart.value)
    console.log('ECharts 实例创建成功，当前地图类型:', isWorldMap.value ? 'world' : 'china')
    
    chart.setOption(option)
    console.log('地图配置设置成功')

    // 点击事件
    chart.on('click', (params) => {
      if (isWorldMap.value) {
        // 世界地图模式
        if (params.name === 'China') {
          // 点击中国区域，切换到中国地图
          isWorldMap.value = false
          initMap()
        } else {
          // 点击其他区域，显示成员信息
          const mapData = getProvinceMapData(isWorldMap.value)
          const data = mapData.find(item => item.name === params.name)
          if (data && data.value > 0) {
            // 根据国家名称找到对应的城市和区域
            if (params.name === 'Japan') {
              selectedArea.value = '日本'
              selectedCity.value = '东京'
            } else if (params.name === 'Sweden') {
              selectedArea.value = '瑞典'
              selectedCity.value = '瑞典'
            }
            
            // 显示使者列表
            showEvangelists.value = true
            // 滚动到成员列表
            setTimeout(() => {
              const container = document.querySelector('.evangelists-container')
              if (container) {
                container.scrollIntoView({ 
                  behavior: 'smooth' 
                })
              }
            }, 300)
          }
        }
      } else {
        // 中国地图模式
        // 保存选中的区域
        selectedArea.value = params.name
        selectedCity.value = null
        // 显示使者列表
        showEvangelists.value = true
        // 滚动到成员列表
        setTimeout(() => {
          const container = document.querySelector('.evangelists-container')
          if (container) {
            container.scrollIntoView({ 
              behavior: 'smooth' 
            })
          }
        }, 300)
      }
    })

    // 添加错误处理
    chart.on('error', (params) => {
      console.error('ECharts 错误:', params)
    })
  } catch (error) {
    console.error('初始化地图失败:', error)
  } finally {
    loading.value = false
  }
}

// 监听窗口大小变化
const handleResize = () => {
  if (chart) {
    chart.resize()
  }
}

const backToWorldMap = async () => {
  console.log('开始返回世界地图...')
  isWorldMap.value = true
  selectedArea.value = null
  selectedCity.value = null
  
  if (chart) {
    chart.dispose()
    chart = null
  }
  
  // 等待 DOM 更新
  await nextTick()
  await initMap()
  console.log('返回世界地图完成')
}

onMounted(async () => {
  console.log('组件挂载，开始加载地图...')
  await loadMapData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) {
    chart.dispose()
    chart = null
  }
})
</script>

<style scoped>
.map-container {
  padding: 20px;
  height: auto;  /* 不再限制整体高度 */
  margin-top: 60px;  /* 为顶部导航留出空间 */
  box-sizing: border-box;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: none;
}

.map-card {
  min-height: 500px;  /* 减小地图高度 */
  border-radius: 8px;
  overflow: hidden;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  margin: 0;
  margin-bottom: 40px;  /* 增加与使者列表的间距 */
}

.map-chart {
  flex: 1;
  width: 100%;
  height: 500px;  /* 固定地图高度 */
  position: relative;
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #666;
  font-size: 16px;
  z-index: 1;
}

.info-card {
  height: calc(100vh - 40px);
  overflow: hidden;
  border-radius: 8px;
  background-color: #fff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.area-stats {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.preacher-list {
  margin-top: 20px;
}

.preacher-list h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 16px;
}

.preacher-item {
  margin-bottom: 15px;
}

.preacher-info {
  display: flex;
  gap: 15px;
}

.preacher-details {
  flex: 1;
}

.preacher-details h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
}

.preacher-details p {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 14px;
}

.preacher-stats {
  display: flex;
  gap: 8px;
}

.evangelist-image {
  width: 100%;
  height: 220px;           /* 可根据实际需求调整高度 */
  object-fit: contain;     /* 保证图片完整显示并缩放 */
  object-position: center top; /* 头部优先显示 */
  background: #fff;        /* 背景色填充空白 */
  border-radius: 8px;
  display: block;
  margin: 0 auto;
  transition: transform 0.3s;
}

.evangelist-card:hover .evangelist-image {
  transform: scale(1.05);
}

.back-btn-wrapper {
  position: absolute;
  top: 24px;
  right: 32px;
  z-index: 10;
}
.back-btn {
  font-size: 14px;
}

.map-tip {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 16px;
  z-index: 10;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  animation: pulse 2s infinite;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

@keyframes pulse {
  0% { opacity: 0.8; }
  50% { opacity: 1; }
  100% { opacity: 0.8; }
}

.map-header {
  text-align: center;
  padding: 20px 0 10px;
  position: relative;
  z-index: 10;
}

.map-title {
  font-size: 28px;
  margin: 0 0 5px;
  color: #333;
  font-weight: bold;
}

.evangelist-count {
  font-size: 16px;
  color: #409eff;
  font-weight: 500;
  margin-bottom: 10px;
}
</style> 