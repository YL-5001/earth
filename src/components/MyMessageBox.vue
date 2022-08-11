<template>
  <div class="msgBox">
    <div class="contentBox">
      <i class="iconfont icon-gongnenglanicon_shanchu" @click="toCloseBox()"></i>
      <h3>当前方案：</h3>
      <p>{{$store.state.myData[$store.state.reportNum].children[$store.state.methodNum].label}}</p>
      <h3>场景名称：</h3>
      <p>{{$store.state.myData[$store.state.reportNum].children[$store.state.methodNum].form.name}}</p>
      <h3>当前地点：</h3>
      <p>{{$store.state.myData[$store.state.reportNum].children[$store.state.methodNum].form.region}}</p>
      <h3>用户名称：</h3>
      <p>{{$store.state.myData[$store.state.reportNum].children[$store.state.methodNum].form.userName}}</p>
      <h3>创建时间：</h3>
      <p>{{$store.state.myData[$store.state.reportNum].children[$store.state.methodNum].form.time}}</p>
      <!-- <h3>测试数据：</h3> -->
      <!-- <p>{{state.myData}}</p> -->
    </div>
  </div>
</template>

<script>
  import store from '@/store'
  export default {
    setup() {

      //关闭信息面板
      const toCloseBox = () => {
        store.commit('toClose')
      }
      return {
        toCloseBox
      }
    }
  }
</script>

<style scoped lang="less">
  .msgBox {
    position: absolute;
    top: 10vh;
    right: 0;
    // width: 200px;
    height: 600px;
    background: rgba(29, 29, 31, 0.72);
    // backdrop-filter: saturate(180%) blur(20px);
    // background-color: rgba(89, 89, 89, 0.15);
    backdrop-filter: blur(6.5px);
    -webkit-backdrop-filter: blur(6.5px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: rgba(14, 14, 14, 0.19) 0px 6px 15px 0px;
    -webkit-box-shadow: rgba(14, 14, 14, 0.19) 0px 6px 15px 0px;
    border-radius: 13px 0 0 13px;
    -webkit-border-radius: 13px 0 0 13px;
    color: rgba(128, 128, 128, 0.6);
    //滑入动画
    -webkit-animation: fade-in 1s;
    animation: fade-in 1s;

    .contentBox {
      padding: 10px;
      color: #fff;

      h3 {
        margin-top: 10px;
      }

      .icon-gongnenglanicon_shanchu {
        font-size: 20px;
      }

      //滑入动画
      @keyframes fade-in {
        from {
          opacity: 0;
          transform: translateY(-10vh);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @-webkit-keyframes fade-in {
        from {
          opacity: 0;
          -webkit-transform: translateY(-10vh);
        }

        to {
          opacity: 1;
          -webkit-transform: translateY(0);
        }
      }
    }
  }
</style>