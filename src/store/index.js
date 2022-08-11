import { createStore } from 'vuex'

export default createStore({
  state: {
    //是否显示新增框
    dialogFormVisible:false,
    //是否显示侧边栏
    showAside:false,
    //是否显示信息框
    showMsg:false,
    //是否显示功能面板
    showTable:false,
    //从后台获取的json，存入vuex
    myData:[],
    //当前点击方案的地址
    nowLocation:'',
    reportNum:0,
    methodNum:0,
    //坐标点
    myPoint:{
      longitude:0, 
      latitude:0, 
      height:0
    },
    //选中的模型
    chooseModel:''
  },
  getters: {
  },
  //修改管理state的方法
  mutations: {
    toShow(state){
      state.showMsg = true
    },
    toShowAside(state){
      state.showAside = !state.showAside
    },
    toShowTable(state){
      state.showTable = !state.showTable
    },
    toClose(state){
      state.showMsg = false
    },
    toCloseAside(state){
      state.showAside = false
    },
    getJson(state,myJson){
      state.myData = myJson
    },
    getReportNum(state,num){
      state.reportNum = num
    },
    getMethodNum(state,num){
      state.methodNum = num
    },
    getMyPoint(state,locationPoint){
      state.myPoint.longitude = locationPoint[0]
      state.myPoint.latitude = locationPoint[1]
      state.myPoint.height = locationPoint[2]
    },
    //获取选中的模型
    getModel(state,chooseModel){
      state.chooseModel = chooseModel
    },
    //把接收到的新增或修改的form存入myData
    getForm(state,form){
      state.myData[state.reportNum].children[state.methodNum].form = form
    }
  },
  actions: {
    
  },
  modules: {
  }
})
