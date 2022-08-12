<template>
  <!-- 最外层盒子 -->
  <div class="bigBox">
    <!-- 头部 -->
    <header>
      <h1>场景演示</h1>
    </header>
    <!-- 内容部分 -->
    <div class="report">
      <!-- 左上角菜单图标 -->
      <div class="btn" @click="toShowAside">
        <i class="iconfont icon-liebiao"></i>
      </div>
      <!-- 侧边栏 -->
      <aside v-if="$store.state.showAside">
        <MyMenu ref="MyMenuComponent" :getMap='getMap' />
      </aside>
      <!-- 内容 -->
      <section>
        <MyMap class="MyMap" ref="MyMapMethod" />
        <MyMessageBox v-if="$store.state.showMsg" />
      </section>
    </div>
  </div>
</template>

<script>
  //引入组件
  import MyMenu from '../components/MyMenu.vue'
  import MyMessageBox from '../components/MyMessageBox.vue'
  import MyMap from '../components/MyMap.vue'
  //引入库
  import {
    ref,
    reactive,
    onMounted
  } from 'vue'
  import {
    useStore
  } from "vuex"
  import axios from 'axios'
  export default {
    name: 'ReportView',
    components: {
      MyMap,
      MyMenu,
      MyMessageBox
    },
    setup() {
      const store = useStore()
      onMounted(() => {
        //页面加载的时候就获取一下json数据
        getData()
      })

      //变量
      //从Node获取的数据
      let data = reactive({
        show: false,
        nowData: {}
      })
      
      //对应MyMap组件要调用的方法
      let MyMapMethod = ref()

      //方法
      //从Node获取数据
      const getData = () => {
        axios.get('http://127.0.0.1/api/get')
          .then((res) => {
            //把读到的JSON存入Vuex
            store.commit('getJson', res.data.data)
            console.log(store.state.myData);
          })
      }
      
      //调用MyMap子组件的方法，给MyMenu使用
      const getMap = () => {
        MyMapMethod.value.fly()
      }

      //是否显示左侧菜单
      const toShowAside = () => {
        store.commit('toShowAside')
      }

      return {
        data,
        MyMapMethod,
        getMap,
        toShowAside
      }
    }
  }
</script>

<style scoped lang="less">
  .bigBox {
    display: flex;
    flex-direction: column;

    .MyMap {
      //使用定位定上去
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    header {
      position: absolute;
      top: 0;
      left: 45vw;
      height: 10vh;
      text-align: center;
      line-height: 10vh;
      z-index: 100;

      h1 {
        color: #fff;
      }
    }

    .report {
      display: flex;
      width: 100%;
      height: 90vh;

      .btn {
        position: absolute;
        top: 1vh;
        left: 1vw;
        cursor: pointer;
        z-index: 200;

        .iconfont {
          color: #fff;
          font-size: 2rem;
        }
      }

      aside {
        .el-row.tac {
          width: 300px;
          height: 200px;
        }

      }

    }

  }
</style>