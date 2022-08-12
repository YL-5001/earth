<template>
  <!-- 左侧菜单 -->
  <el-row class="tac">
    <el-col :span="12">
      <el-menu default-active="2" class="el-menu-vertical-demo" :unique-opened="true" :default-openeds="['1']">
        <!-- :unique-opened="true" 只让一个菜单展开 -->
        <!-- :default-openeds="['1']" 默认展开第一个菜单栏 -->
        <!-- 主菜单 -->
        <el-sub-menu :index="label.id" :key="label.id" v-for="(label,index) in $store.state.myData">
          <template #title>
            <span>{{$store.state.myData[index].label}}</span>
          </template>
          <!-- 子菜单 -->
          <el-menu-item :index="a.id" :key="a.id" v-for="(a) in $store.state.myData[index].children"
            @click="getIndex(a);getMap();showMsg()">
            <span>{{a.label}}</span>
            <!-- 添加的图标 -->
            <i class="iconfont" :class="[ a.form ? 'icon-gongnenglanicon_bianji':'icon-gongnenglanicon_xinzeng']"
              @click="dialogFormVisible = true"></i>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-col>
  </el-row>

  <!-- 点击添加/修改的弹窗 -->
  <el-dialog v-model="dialogFormVisible" title="方案" :modal="false" width="40vw">
    <!-- 输入表单 -->
    <el-form :model="form">
      <el-form-item label="场景名称" :label-width="formLabelWidth">
        <el-input v-model="form.name" autocomplete="off" />
      </el-form-item>
      <el-form-item label="场景时间" :label-width="formLabelWidth">
        <el-input v-model="form.time" autocomplete="off" disabled="disabled" />
      </el-form-item>
      <el-form-item label="用户名称" :label-width="formLabelWidth">
        <el-input v-model="form.userName" autocomplete="off" />
      </el-form-item>
      <el-form-item label="可选区域" :label-width="formLabelWidth">
        <el-select v-model="form.region" placeholder="请选择区域">
          <el-option label="上海" value="shanghai" />
          <el-option label="北京" value="beijing" />
          <el-option label="深圳" value="shenzhen" />
          <el-option label="广州" value="guangzhou" />
          <el-option label="石家庄" value="shijiazhuang" />
        </el-select>
      </el-form-item>
    </el-form>
    <!-- 弹窗底部 -->
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogFormVisible = false ;getForm(form);getMap()">确定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
  //引用时间格式化库
  import moment from 'moment'
  import axios from 'axios'
  import {
    ref,
    reactive
  } from 'vue'
  import store from '@/store'

  export default {
    props: {
      getMap: {
        type: Function,
        required: true //必须要有的
      }
    },
    setup() {
      //变量
      let navData = reactive({
        data: []
      })
      let index = ref(0)
      //把a的数据接收为全局变量
      let aMsg = ref()
      // let num = (aMsg.id * 10) % (Math.floor(aMsg.id) * 10)-1
      let num = ref()
      const dialogFormVisible = ref(false)
      const formLabelWidth = '140px'

      // 新增/编辑的表单
      const form = reactive({
        name: '',
        time: moment(new Date).format('MMMM Do YYYY,h:mm:ss a'),
        userName: '',
        region: ''
      })

      //方法
      //获取输入信息f并传给node
      const getForm = (form) => {
        store.commit('getForm', form)
        console.log(store.state.myData)
        console.log(form)
        //传给node
        axios.post('http://127.0.0.1/api/getNewJson', store.state.myData)
      }

      // 获取点击的子菜单信息
      const getIndex = (a) => {
        let location = ref('')
        //如果还没有添加form，不跳转视图
        if (a.form) {
          location.value = a.form.region
        }
        store.state.nowLocation = location
        aMsg = a //把a的数据接收为全局变量
        //把报告的序号存到vuex
        store.commit('getReportNum', Math.floor(aMsg.id - 1))
        num = (aMsg.id * 10) % (Math.floor(aMsg.id) * 10) - 1
        //把战术的序号存到vuex
        store.commit('getMethodNum', num)
        console.log('看看此时的数据')
        console.log(store.state.myData[store.state.reportNum].children[store.state.methodNum])
      }

      //是否展示信息盒子
      const showMsg = () => {
        store.commit('toShow')
      }

      return {
        navData,
        getIndex,
        index,
        num,
        dialogFormVisible,
        formLabelWidth,
        form,
        getForm,
        aMsg,
        showMsg
      }
    }
  }
</script>

<style scoped lang='less'>
  .iconfont {
    margin-left: 2vw;
    font-size: 25px;
  }

  .el-dialog {
    .el-input {
      width: 300px;
    }

    .el-select {
      width: 300px;
    }

    .el-button {
      border: none;
    }

    .dialog-footer button:first-child {
      margin-right: 10px;
    }
  }

  .el-row {
    position: relative;
    top: 10vh;
    background: rgba(29, 29, 31, 0.72);
    // flex: 3;
    width: 150px;
    height: 430px;
    overflow: hidden;
    backdrop-filter: blur(6.5px);
    -webkit-backdrop-filter: blur(6.5px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: rgba(14, 14, 14, 0.19) 0px 6px 15px 0px;
    -webkit-box-shadow: rgba(14, 14, 14, 0.19) 0px 6px 15px 0px;
    border-radius: 0 13px 13px 0;
    -webkit-border-radius: 0 13px 13px 0;
    z-index: 100;
    //滑入动画
    -webkit-animation: fade-in 0.5s;
    animation: fade-in 0.5s;

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

    .el-menu-vertical-demo {
      width: 148px;
      --el-menu-bg-color: none;
      --el-menu-text-color: #fff;
      //报告hover的背景颜色
      --el-menu-hover-bg-color: rgb(50, 53, 243);
      border: none;
    }

    .el-sub-menu {
      color: #fff;

      .el-menu-item {
        min-width: 0;
      }

      .el-sub-menu__title {
        color: #fff;
      }

      //战术的背景颜色
      .el-menu-item:hover {
        background-color: rgb(127, 187, 228);
      }
    }

    .el-sub-menu__title:hover {
      background-color: rgb(4, 64, 155);
    }
  }
</style>