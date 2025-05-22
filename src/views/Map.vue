<template>
  <div class="map-container">
    <div ref="mapChart" class="map-chart"></div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import chinaJson from '@/assets/china.json'
import { getProvinceMapData, getEvangelistCount, evangelists } from '@/data/evangelists'
import { useRouter } from 'vue-router'

export default {
  name: 'Map',
  setup() {
    const mapChart = ref(null)
    const router = useRouter()
    let chart = null

    // 初始化地图
    const initMap = () => {
      if (!mapChart.value) return
      
      const mapData = getProvinceMapData()
      const totalCount = getEvangelistCount()
      console.log('Map Data:', mapData)
      console.log('Total Evangelists:', totalCount)
      
      if (!chart) {
        // 注册中国地图 geoJson 数据
        echarts.registerMap('china', chinaJson)
        chart = echarts.init(mapChart.value)
      }
      
      chart.setOption({
        title: {
          text: `北辰使者分布图 (共${totalCount}人)`,
          left: 'center',
          top: 20
        },
        geo: {
          map: 'china',
          roam: true,
          label: {
            show: true,
            formatter: (params) => {
              const data = mapData.find(item => item.name === params.name)
              return data ? `${params.name}\n${data.value}人` : params.name
            }
          }
        },
        series: [
          {
            type: 'map',
            map: 'china',
            data: mapData,
            label: {
              show: true,
              formatter: (params) => {
                const data = mapData.find(item => item.name === params.name)
                return data ? `${params.name}\n${data.value}人` : params.name
              }
            },
            emphasis: {
              label: {
                show: true
              }
            }
          }
        ]
      })

      // 添加点击事件处理
      chart.on('click', (params) => {
        const province = params.name
        console.log('Clicked province:', province)
        const data = mapData.find(item => item.name === province)
        console.log('Found data:', data)
        if (data && data.value > 0) {
          router.push({ path: '/evangelists', query: { area: province } })
        }
      })
    }

    // 监听窗口大小变化
    const handleResize = () => {
      chart && chart.resize()
    }

    onMounted(() => {
      initMap()
      window.addEventListener('resize', handleResize)
    })

    // 监听 evangelists 数据变化
    watch(() => evangelists, () => {
      initMap()
    }, { deep: true })

    return {
      mapChart
    }
  }
}
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
}
.map-chart {
  width: 100%;
  height: 100%;
}
</style> 