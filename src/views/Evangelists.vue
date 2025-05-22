<template>
  <div class="evangelists-container">
    <!-- 城市选择下拉框，移至顶部并居中 -->
    <div class="city-dropdown-container">
      <div v-if="selectedArea" class="selection-info">
        已选择: {{ selectedArea }}
      </div>
      <el-select v-model="currentCity" placeholder="选择城市" @change="scrollToCity" class="city-dropdown" v-if="!selectedArea || citiesInSelectedArea.length > 1">
        <el-option
          v-for="city in selectedArea ? citiesInSelectedArea : cities"
          :key="city"
          :label="city"
          :value="city"
        />
      </el-select>
    </div>

    <div class="main-content">
      <!-- 右侧内容区域 -->
      <div class="content-area">
        <div v-for="(cityGroup, city) in filteredEvangelists" :key="city" class="city-section" :id="city">
          <h2 class="city-title">{{ city }}</h2>
          <div class="evangelists-horizontal-scroll">
            <div v-for="evangelist in cityGroup" :key="evangelist.id" class="evangelist-card"
              @click="showDesc(evangelist)" style="cursor:pointer;">
              <div class="image-wrapper">
                <img :src="evangelist.image" :alt="evangelist.name" class="evangelist-image">
              </div>
              <div class="evangelist-info-row">
                <div v-if="evangelist.level" class="badge-side">
                  <img :src="badgeSrc(evangelist.level)" :alt="badgeLabel(evangelist.level) + '徽章'" class="badge-image-row">
                  <div class="badge-label-row">{{ badgeLabel(evangelist.level) }}</div>
                </div>
                <div class="evangelist-info-text" :class="{ 'no-badge': !evangelist.level }">
                  <h3>{{ evangelist.name }}<span v-if="evangelist.nickname" class="nickname-inline">{{ evangelist.nickname }}</span></h3>
                  <div v-if="evangelist.tag" class="tag">{{ evangelist.tag }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 简介浮层 -->
    <transition name="desc-modal-fade">
      <div v-if="descModal.show" class="desc-modal-overlay" @click.self="hideDesc">
        <div class="desc-modal-blur">
          <div class="desc-modal-content">
            <h2>{{ descModal.name }}<span v-if="descModal.nickname"> {{ descModal.nickname }}</span></h2>
            <div v-if="descModal.tag" class="tag">{{ descModal.tag }}</div>
            <div class="desc-modal-text">{{ descModal.description }}</div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { evangelists, cityToProvince } from '@/data/evangelists'

export default {
  name: 'Evangelists',
  props: {
    selectedArea: {
      type: String,
      default: null
    },
    selectedCity: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      currentCity: '',
      hoveredId: null,
      descModal: {
        show: false,
        name: '',
        nickname: '',
        tag: '',
        description: ''
      },
      evangelists,
      cityToProvince,
      scrollIntervals: {}
    }
  },
  computed: {
    groupedEvangelists() {
      const groups = {}
      // 支持 city 参数过滤
      const urlParams = new URLSearchParams(window.location.search)
      const cityParam = urlParams.get('city')
      let filtered = this.evangelists
      if (cityParam) {
        filtered = this.evangelists.filter(e => e.city === cityParam)
      }
      filtered.forEach(evangelist => {
        if (!groups[evangelist.city]) {
          groups[evangelist.city] = []
        }
        groups[evangelist.city].push(evangelist)
      })
      return groups
    },
    cities() {
      return Object.keys(this.groupedEvangelists).sort()
    },
    // 新增：海外使者列表
    overseasEvangelists() {
      return this.evangelists.filter(e => this.cityToProvince[e.city] === '海外')
    },
    // 新增：生成地图数据，按省份聚合使者数量
    provinceMapData() {
      const provinceCount = {}
      this.evangelists.forEach(evangelist => {
        const province = this.cityToProvince[evangelist.city]
        if (province) {
          provinceCount[province] = (provinceCount[province] || 0) + 1
        }
      })
      return Object.entries(provinceCount).map(([name, value]) => ({ name, value }))
    },
    // 新增：获取当前选中区域的城市列表
    citiesInSelectedArea() {
      if (!this.selectedArea) return [];
      
      // 特殊处理日本、瑞典等海外地区
      if (this.selectedArea === '日本' || this.selectedArea === '瑞典') {
        return this.evangelists
          .filter(e => e.city === this.selectedCity)
          .map(e => e.city)
          .filter((city, index, self) => self.indexOf(city) === index);
      }
      
      // 正常处理中国地区
      return this.evangelists
        .filter(e => this.cityToProvince[e.city] === this.selectedArea)
        .map(e => e.city)
        .filter((city, index, self) => self.indexOf(city) === index); // 去重
    },
    // 根据选中的区域过滤城市和使者
    filteredEvangelists() {
      if (this.selectedArea) {
        // 如果选中了区域，过滤出该区域下的所有城市的使者
        const areaGroups = {};
        
        // 特殊处理日本、瑞典等海外地区
        if (this.selectedArea === '日本' || this.selectedArea === '瑞典') {
          // 对于海外地区，直接按城市名筛选
          this.evangelists
            .filter(e => e.city === this.selectedCity)
            .forEach(evangelist => {
              if (!areaGroups[evangelist.city]) {
                areaGroups[evangelist.city] = [];
              }
              areaGroups[evangelist.city].push(evangelist);
            });
        } else {
          // 对于中国地区，按省份筛选
          this.evangelists
            .filter(e => this.cityToProvince[e.city] === this.selectedArea)
            .forEach(evangelist => {
              if (!areaGroups[evangelist.city]) {
                areaGroups[evangelist.city] = [];
              }
              areaGroups[evangelist.city].push(evangelist);
            });
        }
        
        return areaGroups;
      } else if (this.currentCity) {
        // 如果只选择了城市，则只显示该城市
        const cityGroup = {};
        if (this.groupedEvangelists[this.currentCity]) {
          cityGroup[this.currentCity] = this.groupedEvangelists[this.currentCity];
        }
        return cityGroup;
      }
      
      // 默认返回当前城市
      const result = {};
      if (this.currentCity && this.groupedEvangelists[this.currentCity]) {
        result[this.currentCity] = this.groupedEvangelists[this.currentCity];
      }
      return result;
    }
  },
  methods: {
    scrollToCity(city) {
      this.currentCity = city;
      // 如果选择了不同的城市，清除区域选择
      if (this.selectedArea) {
        // 只在componentA内部修改值，不作为事件向外传递
        this.$emit('update:selectedArea', null);
        // 也可以使用this.$nextTick确保视图更新
      }
      this.stopAutoScroll(); // 停止自动滚动
      this.startAutoScroll(); // 重新开始滚动
      
      // 滚动到选中的城市区域
      setTimeout(() => {
        const element = document.getElementById(city);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    },
    startAutoScroll() {
      // 停止所有先前的自动滚动
      this.stopAutoScroll();
      
      // 对每个城市的卡片区域设置自动滚动
      setTimeout(() => {
        // 获取要处理的城市列表
        let cities = [];
        if (this.selectedArea) {
          // 如果选中了区域，处理该区域下的所有城市
          cities = this.citiesInSelectedArea;
        } else if (this.currentCity) {
          // 否则处理当前选中的城市
          cities = [this.currentCity];
        }
        
        // 为每个城市设置滚动
        cities.forEach(city => {
          const scrollContainer = document.querySelector(`#${city} .evangelists-horizontal-scroll`);
          if (scrollContainer && scrollContainer.scrollWidth > scrollContainer.clientWidth) {
            // 只有当内容宽度大于容器宽度时才设置自动滚动
            
            // 计算合适的滚动速度，根据卡片数量动态调整
            let cardCount = 0;
            if (this.selectedArea) {
              // 区域模式下，找到该城市下的卡片数量
              const cityEvangelists = this.evangelists.filter(e => e.city === city);
              cardCount = cityEvangelists.length;
            } else if (this.groupedEvangelists[city]) {
              // 城市模式下直接获取
              cardCount = this.groupedEvangelists[city].length;
            }
            
            // 根据卡片数量，调整滚动速度，卡片越多，速度越快，最小1px，最大4px
            const scrollSpeed = Math.min(Math.max(Math.floor(cardCount / 5), 1), 4);
            
            console.log(`为城市 ${city} 设置自动滚动，卡片数量: ${cardCount}, 速度: ${scrollSpeed}px`);
            
            // 先滚动到最左侧确保从头开始
            scrollContainer.scrollLeft = 0;
            
            this.scrollIntervals[city] = setInterval(() => {
              // 如果已经滚动到最右边，平滑地回到最左边
              if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth - scrollContainer.clientWidth - 20) {
                // 使用动画平滑回到开头
                const smoothReset = () => {
                  if (scrollContainer.scrollLeft > 0) {
                    scrollContainer.scrollLeft = Math.max(0, scrollContainer.scrollLeft - 20);
                    requestAnimationFrame(smoothReset);
                  }
                }
                smoothReset();
              } else {
                // 正常滚动
                scrollContainer.scrollLeft += scrollSpeed;
              }
            }, 30);
            
            // 添加鼠标悬停时暂停滚动的事件
            scrollContainer.addEventListener('mouseenter', () => {
              if (this.scrollIntervals[city]) {
                clearInterval(this.scrollIntervals[city]);
                delete this.scrollIntervals[city];
              }
            });
            
            // 鼠标离开时恢复滚动
            scrollContainer.addEventListener('mouseleave', () => {
              if (!this.scrollIntervals[city]) {
                this.scrollIntervals[city] = setInterval(() => {
                  if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth - scrollContainer.clientWidth - 20) {
                    const smoothReset = () => {
                      if (scrollContainer.scrollLeft > 0) {
                        scrollContainer.scrollLeft = Math.max(0, scrollContainer.scrollLeft - 20);
                        requestAnimationFrame(smoothReset);
                      }
                    }
                    smoothReset();
                  } else {
                    scrollContainer.scrollLeft += scrollSpeed;
                  }
                }, 30);
              }
            });
          }
        });
      }, 500);
    },
    stopAutoScroll() {
      // 清除所有自动滚动的interval
      Object.values(this.scrollIntervals).forEach(interval => {
        clearInterval(interval)
      })
      this.scrollIntervals = {}
    },
    badgeSrc(level) {
      switch(level) {
        case 'silver': return '/images/silver.png';
        case 'golden': return '/images/golden.png';
        case 'platinum': return '/images/platinum.png';
        case 'radiant': return '/images/radiant.png';
        default: return '';
      }
    },
    badgeLabel(level) {
      switch(level) {
        case 'silver': return '银星使者';
        case 'golden': return '金星使者';
        case 'platinum': return '铂星使者';
        case 'radiant': return '星耀使者';
        default: return '';
      }
    },
    showDesc(evangelist) {
      if (!evangelist.description) return;
      this.descModal = {
        show: true,
        name: evangelist.name,
        nickname: evangelist.nickname,
        tag: evangelist.tag,
        description: evangelist.description
      };
    },
    hideDesc() {
      this.descModal.show = false;
    },
    // 新增：根据区域获取城市
    updateCityFromArea() {
      if (this.selectedArea) {
        // 优先使用直接选中的城市
        if (this.selectedCity && this.citiesInSelectedArea.includes(this.selectedCity)) {
          this.currentCity = this.selectedCity;
        } 
        // 特殊处理海外地区
        else if (this.selectedArea === '日本') {
          this.currentCity = '东京';
        }
        else if (this.selectedArea === '瑞典') {
          this.currentCity = '瑞典';
        }
        // 广东省特殊处理，有多个城市
        else if (this.selectedArea === '广东省' && this.citiesInSelectedArea.length > 0) {
          // 如果没有明确选择，则默认使用该区域下的第一个城市
          this.currentCity = this.citiesInSelectedArea[0];
        }
        // 如果选中的是区域，则找到该区域下的第一个城市
        else if (this.citiesInSelectedArea.length > 0) {
          this.currentCity = this.citiesInSelectedArea[0];
        }
      }
    }
  },
  watch: {
    // 监听selectedArea和selectedCity变化
    selectedArea() {
      // 确保在区域变化时更新城市选择
      this.updateCityFromArea();
      // 如果citiesInSelectedArea有城市，直接设置为第一个
      if (this.citiesInSelectedArea && this.citiesInSelectedArea.length > 0) {
        this.currentCity = this.citiesInSelectedArea[0];
      }
      this.stopAutoScroll();
      this.startAutoScroll();
    },
    selectedCity(newVal) {
      if (newVal) {
        this.currentCity = newVal;
        this.stopAutoScroll();
        this.startAutoScroll();
      }
    }
  },
  mounted() {
    // 设置初始城市
    if (this.cities.length > 0) {
      this.currentCity = this.cities[0]
    }
    // 省份到主要城市映射
    const provinceToCity = {
      '北京市': '北京',
      '天津市': '天津',
      '上海市': '上海',
      '重庆市': '重庆',
      '河北省': '石家庄',
      '山西省': '太原',
      '辽宁省': '沈阳',
      '吉林省': '长春',
      '黑龙江省': '哈尔滨',
      '江苏省': '南京',
      '浙江省': '杭州',
      '安徽省': '合肥',
      '福建省': '福州',
      '江西省': '南昌',
      '山东省': '济南',
      '河南省': '郑州',
      '湖北省': '武汉',
      '湖南省': '长沙',
      '广东省': '广州',
      '海南省': '海口',
      '四川省': '成都',
      '贵州省': '贵阳',
      '云南省': '昆明',
      '陕西省': '西安',
      '甘肃省': '兰州',
      '青海省': '西宁',
      '台湾省': '台北',
      '内蒙古自治区': '呼和浩特',
      '广西壮族自治区': '南宁',
      '西藏自治区': '拉萨',
      '宁夏回族自治区': '银川',
      '新疆维吾尔自治区': '乌鲁木齐',
      '香港特别行政区': '香港',
      '澳门特别行政区': '澳门',
      '杭州市': '杭州',
      '南京市': '南京',
      '济南市': '济南',
      '深圳市': '深圳'
    }
    // 自动滚动到 area/city 参数指定的城市
    const urlParams = new URLSearchParams(window.location.search)
    const area = urlParams.get('area')
    const cityParam = urlParams.get('city')
    let targetCity = null
    if (cityParam && this.cities.includes(cityParam)) {
      targetCity = cityParam
    } else if (area) {
      const cityKey = provinceToCity[area]
      if (cityKey && this.cities.includes(cityKey)) {
        targetCity = cityKey
      } else {
        const match = this.evangelists.find(e => this.cityToProvince[e.city] === area)
        if (match && this.cities.includes(match.city)) {
          targetCity = match.city
        }
      }
    }
    if (targetCity) {
      setTimeout(() => {
        this.scrollToCity(targetCity)
        this.currentCity = targetCity
      }, 100)
    }
    
    // 初始化自动滚动
    this.startAutoScroll()
    
    // 如果有从地图点击传递的区域或城市信息，更新当前城市
    this.updateCityFromArea();
  },
  beforeUnmount() {
    this.stopAutoScroll()
  }
}
</script>

<style scoped>
.evangelists-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
}

/* 城市下拉框容器样式 */
.city-dropdown-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-bottom: 2rem;
}

/* 城市下拉框样式 */
.city-dropdown {
  width: 400px;
  height: 40px;
  text-align: center;
}

/* 选中区域提示信息 */
.selection-info {
  margin-bottom: 1rem;
  padding: 0.5rem 1.5rem;
  background-color: #ecf5ff;
  border-radius: 4px;
  color: #409eff;
  font-weight: bold;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.main-content {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.timeline-scroll {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.timeline-item {
  padding: 0.8rem 1rem;
  color: #666;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.3s ease;
  background: #f5f5f5;
  text-align: center;
}

.timeline-item:hover {
  background: #e0e0e0;
  color: #333;
}

.timeline-item.active {
  background: #007bff;
  color: white;
}

/* 右侧内容区域 */
.content-area {
  flex: 1;
  min-width: 0; /* 防止内容溢出 */
  width: 100%;
}

.city-section {
  margin-bottom: 3rem;
  scroll-margin-top: 2rem;
  width: 100%;
}

.city-title {
  color: #2c3e50;
  border-bottom: 2px solid #eee;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
}

.evangelists-horizontal-scroll {
  display: flex;
  flex-direction: row;
  gap: 0.8rem;
  overflow-x: auto;
  padding-bottom: 1rem;
  margin-bottom: 2rem;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
  width: 100%;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  /* 隐藏滚动条但保持功能 */
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  flex-wrap: nowrap; /* 防止换行 */
}

.evangelists-horizontal-scroll::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

.evangelist-card {
  min-width: 320px;
  max-width: 320px;
  width: 320px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.evangelist-card:hover {
  transform: translateY(-5px);
}

.image-wrapper {
  width: 100%;
  height: 200px;
  overflow: hidden;
  position: relative;
}

.evangelist-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform-origin: center top;
  transition: transform 0.3s ease;
}

.evangelist-card:hover .evangelist-image {
  transform: scale(1.05);
  transition: transform 0.3s ease;
}

.evangelist-info-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.2rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  flex: 1;
}

.evangelist-info-text, .badge-side {
  justify-content: center;
}

.badge-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 70px;
}

.badge-image-row {
  width: 40px;
  height: 40px;
  object-fit: contain;
  flex-shrink: 0;
}

.badge-label-row {
  font-size: 0.95rem;
  color: #007bff;
  font-weight: bold;
  letter-spacing: 2px;
  margin-top: 0.2rem;
  text-align: center;
}

.evangelist-info-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.evangelist-info-text.no-badge {
  margin-left: 0;
  align-items: flex-start;
}

.evangelist-info-text h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.city {
  color: #666;
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }

  .city-dropdown {
    width: 90%;
    max-width: 400px;
  }

  .timeline-scroll {
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .timeline-item {
    white-space: nowrap;
  }
}

.badge-block, .badge-label { display: none; }

.avatar-nickname-block {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}
.avatar-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #1de9b6;
  background: #fff;
}
.nickname {
  font-size: 1.3rem;
  font-weight: bold;
  color: #111;
}
.tag {
  font-size: 1.05rem;
  color: #888;
  margin-top: 0.2rem;
}
.avatar-logo-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.badge-image-under-avatar {
  width: 40px;
  height: 40px;
  object-fit: contain;
  margin-top: -12px;
  background: #fff;
  border-radius: 50%;
  border: 2px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  z-index: 1;
}
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(.4,0,.2,1);
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
.fade-slide-enter-to, .fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.description {
  font-size: 1.25rem;
  color: #222;
  margin-top: 0.5rem;
  line-height: 1.7;
  background: rgba(255,255,255,0.95);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 1rem;
}
.avatar-large {
  width: 120px;
  height: 120px;
}
.fanone-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem 1.5rem 1rem;
}
.desc-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(30, 32, 38, 0.35);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
}
.desc-modal-blur {
  background: rgba(255,255,255,0.7);
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  padding: 2.5rem 2rem 2rem 2rem;
  min-width: 320px;
  max-width: 420px;
  width: 90vw;
  max-height: 70vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(12px);
}
.desc-modal-content {
  text-align: center;
}
.desc-modal-content h2 {
  font-size: 1.6rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}
.desc-modal-content .tag {
  color: #007bff;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}
.desc-modal-text {
  font-size: 1.18rem;
  color: #222;
  line-height: 1.8;
  margin-top: 0.5rem;
  word-break: break-all;
}
.desc-modal-fade-enter-active, .desc-modal-fade-leave-active {
  transition: all 0.35s cubic-bezier(.4,0,.2,1);
}
.desc-modal-fade-enter-from, .desc-modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
.desc-modal-fade-enter-to, .desc-modal-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}
.nickname-inline {
  margin-left: 0.5em;
  font-weight: normal;
  color: #222;
}
.overseas-card {
  background: #f0f8ff;
  border-radius: 8px;
  padding: 1rem 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.08);
}
.overseas-card h3 {
  color: #007bff;
  margin-bottom: 0.5rem;
}
.overseas-card ul {
  margin: 0;
  padding-left: 1.2em;
}
.overseas-card li {
  color: #333;
  font-size: 1.1rem;
  margin-bottom: 0.2rem;
}
</style> 