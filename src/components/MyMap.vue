<template>
  <div id="map" @contextmenu.prevent="getMouseXY($event)">
    <div class="btn" @click="toShowTable">
      <i class="iconfont icon-jichugongneng"></i>
    </div>
    <!-- 地图功能 -->
    <div class="functionTable" v-show="$store.state.showTable">
      <!-- 标记点功能 -->
      <div title="添加标记" class="iconfont icon-a-mubiaobiaoji" @click="goMark"></div>
      <!-- 测距功能 -->
      <div title="测距/侧面积" class="iconfont icon-ranging_line" @click="goMeasure"></div>
      <!-- 放置模型功能 -->
      <div title="放置模型" class="iconfont icon-jiandanmoxing" @click="goModel"></div>
      <!-- 清除功能 -->
      <div title="清除" class="iconfont icon-qingchu1" @click="goClear"></div>
    </div>

    <!-- 测量方式选择面板 -->
    <div class="measureTable" v-show="showMeasureChoose">
      <el-select value-key="id" v-model="value" class="m-2" placeholder="选择测量方式" >
        <!-- <el-option v-for="item in options" :key="item.id" :label="item.text" :value="item" /> -->
        <el-option value="测距离" @click="measureDistance()"/>
        <el-option value="测面积" @click="measureArea()" />
      </el-select>
    </div>

    <!-- 模型选择面板 -->
    <div class="modelsTable" v-show="showChoose">
      <el-select value-key="id" v-model="value" class="m-2" placeholder="选择模型" @change="getOption(value)">
        <el-option v-for="item in options" :key="item.id" :label="item.text" :value="item" />
      </el-select>
    </div>
    <!-- 右键菜单 -->
    <div class="rightClick" v-show="showRightClickMenu" :style="{top:yPosition+'px',left:xPosition+'px'}">
      <ul>
        <li @click="heighLightModel">高亮模型</li>
        <li @click="adjustModel">调整方位</li>
        <li @click="moveModel">机动计划</li>
        <li @click="deleteModel">删除模型</li>
      </ul>
    </div>
    <!-- 调整模型面板 -->
    <div class="adjustModelTable" v-show="showAdjustModel">
      <div class="slider-demo-block">
        <div>heading</div>
        <!-- @input="adjustModel()"数据改变时触发（使用鼠标拖曳时，活动过程实时触发） -->
        <el-slider v-model="headingValue" show-input @input="adjustModel()" />
        <div>pitch</div>
        <el-slider v-model="pitchValue" show-input @input="adjustModel()" />
        <div>roll</div>
        <el-slider v-model="rollValue" show-input @input="adjustModel()" />
      </div>
      <el-button class="cancel" @click="cancelAdjust()">取消</el-button>
      <el-button type="primary" @click="showAdjustModel = false">确认</el-button>
    </div>

  </div>

</template>

<script>
  import {
    ref,
    onMounted,
    reactive,
    computed
  } from 'vue'
  import store from '@/store'
  import * as Cesium from "cesium"
  export default {
    setup() {
      onMounted(() => {
        initMap()
      });

      //变量
      //是否显示测量选择菜单
      let showMeasureChoose = ref(false)
      //是否显示模型选择菜单
      let showChoose = ref(false)
      //是否显示右键菜单
      let showRightClickMenu = ref(false)
      //是否显示调整模型面板
      let showAdjustModel = ref(false)
      // 调整面板数值
      let headingValue = ref(0)
      let pitchValue = ref(0)
      let rollValue = ref(0)
      //获取的鼠标位置
      let xPosition = ref(0)
      let yPosition = ref(0)
      //存储3D模型
      let entityModel
      //声明
      let viewer;
      //标点功能
      const goMark = () => {
        addMark()
      }

      //测距侧面积功能
      const goMeasure = () => {
        showMeasureChoose.value = !showMeasureChoose.value
      }

      //放置模型功能
      const goModel = () => {
        //显示选择框
        showChoose.value = !showChoose.value
      }

      //清除功能
      const goClear = () => {
        //删除所有实体
        // viewer.entities.removeAll();
        //删除除模型以外的实体
        removeEntityByName('标点')
        removeEntityByName('直线')
        removeEntityByName('多边形')
        removeEntityByName('多边形面积区域')
        removeEntityByName('空间直线距离')
        removeEntityByName('多边形面积')
      }

      // 根据name删除实体
      const removeEntityByName = (value) => {
        // 清除之前的实体
        const entitys = viewer.entities._entities._array;
        let length = entitys.length
        // 倒叙遍历防止实体减少之后entitys[f]不存在
        for (let f = length - 1; f >= 0; f--) {
          if (entitys[f]._name && entitys[f]._name === value) {
              viewer.entities.remove(entitys[f]);
          }
        }
      }
      
      //镜头切换
      const toLocation = () => {
        switch (store.state.nowLocation) {
          case 'beijing':
            return Cesium.Cartesian3.fromDegrees(116, 39.8, 60000)
          case 'guangzhou':
            return Cesium.Cartesian3.fromDegrees(113, 23, 60000)
          case 'shanghai':
            return Cesium.Cartesian3.fromDegrees(121, 31, 60000)
          case 'shenzhen':
            return Cesium.Cartesian3.fromDegrees(114, 22, 60000)
          case 'shijiazhuang':
            return Cesium.Cartesian3.fromDegrees(114.5, 38, 60000)

            //默认地点
          default:
            return Cesium.Cartesian3.fromDegrees(0, 0, 6000000)
        }
      }

      //初始化地球
      const initMap = () => {
        let vmodels = Cesium.createDefaultImageryProviderViewModels();
        let config = {
          geocoder: false, // 位置查找工具
          homeButton: false, // 视角返回初始位置
          sceneModePicker: false, // 选择视角的模式（球体、平铺、斜视平铺）
          baseLayerPicker: false, // 图层选择器（地形影像服务）
          navigationHelpButton: false, // 导航帮助(手势，鼠标)
          //animation: false, // 左下角仪表盘（动画器件）
          //timeline: false, // 底部时间线
          fullscreenButton: false, // 全屏
          vrButton: false, // VR
          //修改地图加载问题
          baseLayerPicker: true,
          imageryProviderViewModels: vmodels,
          selectedImageryProviderViewModel: vmodels[9]
        }
        viewer = new Cesium.Viewer("map", config); //此处的map为自己盒子的id
        // 去除版权信息
        viewer._cesiumWidget._creditContainer.style.display = "none";
      }

      //点击加点
      const addMark = () => {
        //获取点击的经纬度
        var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction(function (movement) {
          var position = viewer.scene.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
          // console.log(position);
          //将笛卡尔坐标转化为经纬度坐标
          var cartographic = Cesium.Cartographic.fromCartesian(position);
          var longitude = Cesium.Math.toDegrees(cartographic.longitude);
          var latitude = Cesium.Math.toDegrees(cartographic.latitude);
          var height = cartographic.height;
          console.log(longitude, latitude, height)
          //把坐标存入vuex
          let locationPoint = reactive([longitude, latitude, height])
          store.commit('getMyPoint', locationPoint)
          console.log(store.state.myPoint)
          //标点
          viewer.entities.add({
            name: '标点',
            // fromDegrees（经度，纬度，高度，椭球，结果）从以度为单位的经度和纬度值返回Cartesian3位置
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
            point: {
              // 点的大小（像素）
              pixelSize: 5,
              // 点位颜色，fromCssColorString 可以直接使用CSS颜色
              color: Cesium.Color.fromCssColorString('#ee0000'),
              // 边框颜色
              outlineColor: Cesium.Color.fromCssColorString('#fff'),
              // 边框宽度(像素)
              outlineWidth: 2,
              // 是否显示
              show: true
            },
            label: { //文字标签
              text: `经度：${store.state.myPoint.longitude}
                     纬度：${store.state.myPoint.latitude}
                     高度：${store.state.myPoint.height}`,
              font: '500 30px Helvetica', // 15pt monospace
              scale: 0.5,
              style: Cesium.LabelStyle.FILL,
              fillColor: Cesium.Color.WHITE,
              pixelOffset: new Cesium.Cartesian2(0, -75), //偏移量
              showBackground: true,
              backgroundColor: new Cesium.Color(0.5, 0.6, 1, 1.0)
            }
          });

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        // viewer.zoomTo(viewer.entities);
        //右键结束
        handler.setInputAction(function (movement) {
          handler.destroy() // 关闭事件句柄
          return
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
      }

      //测距侧面积
      const measureArea = () => {
        let measureFeature_line = []
        let measureFeature_polygon = []
        measureLineSpace()
        measureAreaSpace()
        clearMeasureFeature()

        function measureLineSpace() {
          var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
          // 取消双击事件-追踪该位置
          viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
            Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
          )

          handler = new Cesium.ScreenSpaceEventHandler(
            viewer.scene._imageryLayerCollection
          )
          var positions = []
          var poly = null
          var distance = 0
          var cartesian = null
          var floatingPoint

          handler.setInputAction(function (movement) {
            // cartesian = viewer.scene.pickPosition(movement.endPosition);
            const ray = viewer.camera.getPickRay(movement.endPosition)
            cartesian = viewer.scene.globe.pick(ray, viewer.scene)
            // cartesian = viewer.scene.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
            if (positions.length >= 2) {
              if (!Cesium.defined(poly)) {
                poly = new PolyLinePrimitive(positions)
              } else {
                positions.pop()
                // cartesian.y += (1 + Math.random());
                positions.push(cartesian)
              }
              distance = getSpaceDistance(positions)
            }
          }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

          handler.setInputAction(function (movement) {
            // cartesian = viewer.scene.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
            // cartesian = viewer.scene.pickPosition(movement.position);
            const ray = viewer.camera.getPickRay(movement.position)
            cartesian = viewer.scene.globe.pick(ray, viewer.scene)
            if (positions.length == 0) {
              positions.push(cartesian.clone())
            }
            positions.push(cartesian)
            // 在三维场景中添加Label
            //   var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            var textDisance
            if (distance > 1000) {
              textDisance = (distance / 1000).toFixed(2) + 'km'
            } else {
              textDisance = distance + 'm'
            }

            floatingPoint = viewer.entities.add({
              name: '空间直线距离',
              // position: Cesium.Cartesian3.fromDegrees(cartographic.longitude / Math.PI * 180, cartographic.latitude / Math.PI * 180,cartographic.height),
              position: positions[positions.length - 1],
              point: {
                pixelSize: 5,
                color: Cesium.Color.WHITE,
                // outlineColor: new Cesium.Color(1, 0, 0, 1),
                outlineColor: Cesium.Color.DEEPSKYBLUE,
                outlineWidth: 3
              },
              label: {
                text: textDisance,
                font: '16px sans-serif',
                fillColor: Cesium.Color.DARKORANGE,
                // style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                // outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(20, -20)
              }
            })
            measureFeature_line.push(floatingPoint)
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

          handler.setInputAction(function (movement) {
            handler.destroy() // 关闭事件句柄
            positions.pop() // 最后一个点无效
            // viewer.entities.remove(floatingPoint);
          }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

          var PolyLinePrimitive = (function () {
            function _(positions) {
              this.options = {
                name: '直线',
                polyline: {
                  show: true,
                  positions: [],
                  material: new Cesium.Color(0, 124 / 255, 247 / 255, 1),
                  // material: Cesium.Color.CHARTREUSE,
                  width: 3,
                  clampToGround: true
                }
              }
              this.positions = positions
              this._init()
            }

            _.prototype._init = function () {
              var _self = this
              var _update = function () {
                return _self.positions
              }
              // 实时更新polyline.positions
              this.options.polyline.positions = new Cesium.CallbackProperty(
                _update,
                false
              )
              const line = viewer.entities.add(this.options)
              measureFeature_line.push(line)
            }

            return _
          })()
          console.log(measureFeature_line, 'measureFeature_line')

          // 空间两点距离计算函数
          function getSpaceDistance(positions) {
            var distance = 0
            for (var i = 0; i < positions.length - 1; i++) {
              var point1cartographic = Cesium.Cartographic.fromCartesian(
                positions[i]
              )
              var point2cartographic = Cesium.Cartographic.fromCartesian(
                positions[i + 1]
              )
              /** 根据经纬度计算出距离**/
              var geodesic = new Cesium.EllipsoidGeodesic()
              geodesic.setEndPoints(point1cartographic, point2cartographic)
              var s = geodesic.surfaceDistance
              // console.log(Math.sqrt(Math.pow(distance, 2) + Math.pow(endheight, 2)));
              // 返回两点之间的距离
              s = Math.sqrt(
                Math.pow(s, 2) +
                Math.pow(point2cartographic.height - point1cartographic.height, 2)
              )
              distance = distance + s
            }
            return distance.toFixed(2)
          }
        }

        function measureAreaSpace() {
          var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
          // 取消双击事件-追踪该位置
          viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
            Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
          )
          // 鼠标事件
          handler = new Cesium.ScreenSpaceEventHandler(
            viewer.scene._imageryLayerCollection
          )
          var positions = []
          var tempPoints = []
          var polygon = null
          var cartesian = null
          var floatingPoint

          handler.setInputAction(function (movement) {
            const ray = viewer.camera.getPickRay(movement.endPosition)
            cartesian = viewer.scene.globe.pick(ray, viewer.scene)
            // cartesian = viewer.scene.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
            if (positions.length >= 2) {
              if (!Cesium.defined(polygon)) {
                polygon = new PolygonPrimitive(positions)
              } else {
                positions.pop()
                positions.push(cartesian)
              }
            }
          }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

          handler.setInputAction(function (movement) {
            const ray = viewer.camera.getPickRay(movement.position)
            cartesian = viewer.scene.globe.pick(ray, viewer.scene)
            // cartesian = viewer.scene.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
            if (positions.length == 0) {
              positions.push(cartesian.clone())
            }
            // positions.pop();
            positions.push(cartesian)
            // 在三维场景中添加点
            var cartographic = Cesium.Cartographic.fromCartesian(
              positions[positions.length - 1]
            )
            var longitudeString = Cesium.Math.toDegrees(cartographic.longitude)
            var latitudeString = Cesium.Math.toDegrees(cartographic.latitude)
            var heightString = cartographic.height
            tempPoints.push({
              lon: longitudeString,
              lat: latitudeString,
              hei: heightString
            })
            floatingPoint = viewer.entities.add({
              name: '多边形面积',
              position: positions[positions.length - 1],
              point: {
                pixelSize: 5,
                color: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.DEEPSKYBLUE,
                outlineWidth: 3
              }
            })
            measureFeature_polygon.push(floatingPoint)
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

          handler.setInputAction(function (movement) {
            handler.destroy()
            positions.pop()
            debugger
            var polyCenter = Cesium.BoundingSphere.fromPoints(positions).center
            var textArea = getArea(tempPoints) + 'km²'
            const _label = viewer.entities.add({
              name: '多边形面积区域',
              position: polyCenter,
              // position: positions[positions.length - 1],
              label: {
                text: textArea,
                font: '16px sans-serif',
                // fillColor: new Cesium.Color(255 / 255, 99 / 255, 25 / 255, 1),
                fillColor: Cesium.Color.DARKORANGE,
                // style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                // outlineWidth: 2,
                // verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                // pixelOffset: new Cesium.Cartesian2(20, -40),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
              }
            })
            measureFeature_polygon.push(_label)
          }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

          var radiansPerDegree = Math.PI / 180.0 // 角度转化为弧度(rad)
          var degreesPerRadian = 180.0 / Math.PI // 弧度转化为角度

          // 计算多边形面积
          function getArea(points) {
            var res = 0
            // 拆分三角曲面
            for (var i = 0; i < points.length - 2; i++) {
              var j = (i + 1) % points.length
              var k = (i + 2) % points.length
              var totalAngle = Angle(points[i], points[j], points[k])

              var dis_temp1 = distance(positions[i], positions[j])
              var dis_temp2 = distance(positions[j], positions[k])
              res += dis_temp1 * dis_temp2 * Math.abs(Math.sin(totalAngle))
              console.log(res)
            }

            return (res / 1000000.0).toFixed(4)
          }

          /* 角度 */
          function Angle(p1, p2, p3) {
            var bearing21 = Bearing(p2, p1)
            var bearing23 = Bearing(p2, p3)
            var angle = bearing21 - bearing23
            if (angle < 0) {
              angle += 360
            }
            return angle
          }
          /* 方向 */
          function Bearing(from, to) {
            var lat1 = from.lat * radiansPerDegree
            var lon1 = from.lon * radiansPerDegree
            var lat2 = to.lat * radiansPerDegree
            var lon2 = to.lon * radiansPerDegree
            var angle = -Math.atan2(
              Math.sin(lon1 - lon2) * Math.cos(lat2),
              Math.cos(lat1) * Math.sin(lat2) -
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2)
            )
            if (angle < 0) {
              angle += Math.PI * 2.0
            }
            angle = angle * degreesPerRadian // 角度
            return angle
          }

          var PolygonPrimitive = (function () {
            function _(positions) {
              this.options = {
                name: '多边形',
                polygon: {
                  hierarchy: [],
                  // perPositionHeight : true,
                  material: new Cesium.Color(0, 124 / 255, 247 / 255, 0.5)
                  // material: Cesium.Color.GREEN.withAlpha(0.5)
                  // heightReference:20000
                }
              }

              this.hierarchy = {
                positions
              }
              this._init()
            }

            _.prototype._init = function () {
              var _self = this
              var _update = function () {
                return _self.hierarchy
              }
              // 实时更新polygon.hierarchy
              this.options.polygon.hierarchy = new Cesium.CallbackProperty(
                _update,
                false
              )
              const _polygon = viewer.entities.add(this.options)
              measureFeature_polygon.push(_polygon)
            }

            return _
          })()

          function distance(point1, point2) {
            var point1cartographic = Cesium.Cartographic.fromCartesian(point1)
            var point2cartographic = Cesium.Cartographic.fromCartesian(point2)
            /** 根据经纬度计算出距离**/
            var geodesic = new Cesium.EllipsoidGeodesic()
            geodesic.setEndPoints(point1cartographic, point2cartographic)
            var s = geodesic.surfaceDistance
            // console.log(Math.sqrt(Math.pow(distance, 2) + Math.pow(endheight, 2)));
            // 返回两点之间的距离
            s = Math.sqrt(
              Math.pow(s, 2) +
              Math.pow(point2cartographic.height - point1cartographic.height, 2)
            )
            return s
          }
        }

        function clearMeasureFeature() {
          viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK)
          viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
          viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)
          if (measureFeature_line.length) {
            measureFeature_line.forEach(item => {
              viewer.entities.remove(item)
            })
            measureFeature_line = []
          }
          if (measureFeature_polygon.length) {
            measureFeature_polygon.forEach(item => {
              viewer.entities.remove(item)
            })
            measureFeature_polygon = []
          }
        }
      }

      //单测距离
      const measureDistance = () => {
        let measureFeature_line = []
        let measureFeature_polygon = []
        measureLineSpace()
        clearMeasureFeature()

        function measureLineSpace() {
          var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
          // 取消双击事件-追踪该位置
          viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
            Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
          )

          handler = new Cesium.ScreenSpaceEventHandler(
            viewer.scene._imageryLayerCollection
          )
          var positions = []
          var poly = null
          var distance = 0
          var cartesian = null
          var floatingPoint

          handler.setInputAction(function (movement) {
            // cartesian = viewer.scene.pickPosition(movement.endPosition);
            const ray = viewer.camera.getPickRay(movement.endPosition)
            cartesian = viewer.scene.globe.pick(ray, viewer.scene)
            // cartesian = viewer.scene.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
            if (positions.length >= 2) {
              if (!Cesium.defined(poly)) {
                poly = new PolyLinePrimitive(positions)
              } else {
                positions.pop()
                // cartesian.y += (1 + Math.random());
                positions.push(cartesian)
              }
              distance = getSpaceDistance(positions)
            }
          }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

          handler.setInputAction(function (movement) {
            // cartesian = viewer.scene.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
            // cartesian = viewer.scene.pickPosition(movement.position);
            const ray = viewer.camera.getPickRay(movement.position)
            cartesian = viewer.scene.globe.pick(ray, viewer.scene)
            if (positions.length == 0) {
              positions.push(cartesian.clone())
            }
            positions.push(cartesian)
            // 在三维场景中添加Label
            //   var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            var textDisance
            if (distance > 1000) {
              textDisance = (distance / 1000).toFixed(2) + 'km'
            } else {
              textDisance = distance + 'm'
            }

            floatingPoint = viewer.entities.add({
              name: '空间直线距离',
              // position: Cesium.Cartesian3.fromDegrees(cartographic.longitude / Math.PI * 180, cartographic.latitude / Math.PI * 180,cartographic.height),
              position: positions[positions.length - 1],
              point: {
                pixelSize: 5,
                color: Cesium.Color.WHITE,
                // outlineColor: new Cesium.Color(1, 0, 0, 1),
                outlineColor: Cesium.Color.DEEPSKYBLUE,
                outlineWidth: 3
              },
              label: {
                text: textDisance,
                font: '16px sans-serif',
                fillColor: Cesium.Color.DARKORANGE,
                // style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                // outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(20, -20)
              }
            })
            measureFeature_line.push(floatingPoint)
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

          handler.setInputAction(function (movement) {
            handler.destroy() // 关闭事件句柄
            positions.pop() // 最后一个点无效
            // viewer.entities.remove(floatingPoint);
          }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

          var PolyLinePrimitive = (function () {
            function _(positions) {
              this.options = {
                name: '直线',
                polyline: {
                  show: true,
                  positions: [],
                  material: new Cesium.Color(0, 124 / 255, 247 / 255, 1),
                  // material: Cesium.Color.CHARTREUSE,
                  width: 3,
                  clampToGround: true
                }
              }
              this.positions = positions
              this._init()
            }

            _.prototype._init = function () {
              var _self = this
              var _update = function () {
                return _self.positions
              }
              // 实时更新polyline.positions
              this.options.polyline.positions = new Cesium.CallbackProperty(
                _update,
                false
              )
              const line = viewer.entities.add(this.options)
              measureFeature_line.push(line)
            }

            return _
          })()
          console.log(measureFeature_line, 'measureFeature_line')

          // 空间两点距离计算函数
          function getSpaceDistance(positions) {
            var distance = 0
            for (var i = 0; i < positions.length - 1; i++) {
              var point1cartographic = Cesium.Cartographic.fromCartesian(
                positions[i]
              )
              var point2cartographic = Cesium.Cartographic.fromCartesian(
                positions[i + 1]
              )
              /** 根据经纬度计算出距离**/
              var geodesic = new Cesium.EllipsoidGeodesic()
              geodesic.setEndPoints(point1cartographic, point2cartographic)
              var s = geodesic.surfaceDistance
              // console.log(Math.sqrt(Math.pow(distance, 2) + Math.pow(endheight, 2)));
              // 返回两点之间的距离
              s = Math.sqrt(
                Math.pow(s, 2) +
                Math.pow(point2cartographic.height - point1cartographic.height, 2)
              )
              distance = distance + s
            }
            return distance.toFixed(2)
          }
        }

        function clearMeasureFeature() {
          viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK)
          viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
          viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)
          if (measureFeature_line.length) {
            measureFeature_line.forEach(item => {
              viewer.entities.remove(item)
            })
            measureFeature_line = []
          }
          if (measureFeature_polygon.length) {
            measureFeature_polygon.forEach(item => {
              viewer.entities.remove(item)
            })
            measureFeature_polygon = []
          }
        }
      }

      //切换视图
      const fly = () => {
        viewer.camera.flyTo({
          destination: toLocation(),
          //destination:Cesium.Cartesian3.fromDegrees(116, 30, 6000000),
          orientation: {
            heading: Cesium.Math.toRadians(-15),
            pitch: Cesium.Math.toRadians(-65),
            roll: Cesium.Math.toRadians(0)
          },
          duration: 3, //动画持续时间
          // complete: function () //飞行完毕后执行的动作
          // {
          //   addEntities();
          // }
        });
        console.log('执行了fly');
      }

      //存储3D模型
      //模型下拉菜单数据
      const value = ref('')
      const options = [{
          id: 1,
          text: "汽车",
          value: 'qiche',
          url: "/models/GroundVehicle.glb"
        },
        {
          id: 2,
          text: "热气球",
          value: 'tanke',
          url: "/models/CesiumBalloon.glb"
        },
        {
          id: 3,
          text: "飞机",
          value: 'feiji',
          url: "/models/Cesium_Air.glb"
        },
      ]

      //全局的模型坐标
      let modelLongitude
      let modelLatitude
      let modelHeight

      //添加3D模型的
      function createModel() {
        var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction(function (movement) {
          var position = viewer.scene.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
          //将笛卡尔坐标转化为经纬度坐标
          var cartographic = Cesium.Cartographic.fromCartesian(position);
          var longitude = Cesium.Math.toDegrees(cartographic.longitude);
          var latitude = Cesium.Math.toDegrees(cartographic.latitude);
          var height = cartographic.height;
          modelLongitude = longitude
          modelLatitude = latitude
          modelHeight = height
          //引入3D模型
          var entity = viewer.entities.add({

            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
            model: {
              uri: store.state.chooseModel,
              // color: Cesium.Color.fromAlpha(Cesium.Color.BLUE, 1),
              //color: entityModel.color,//设置模型颜色与透明度
              minimumPixelSize: 128, //最小尺寸，防止太小而看不见
              maximumScale: 20000,
            },
          });
          console.log(entity.model.color);
          // entity.model.color = entityModel.color
          // viewer.trackedEntity = entity;
          //把相机绑定到entity实例上
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        //右键结束
        handler.setInputAction(function (movement) {
          handler.destroy() // 关闭事件句柄
          return
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
        rightClick()
      }

      //是否显示功能模块
      const toShowTable = () => {
        store.commit('toShowTable')
      }

      //获取下拉菜单选中的模型
      const getOption = (option) => {
        // console.log(option)
        store.commit('getModel', option.url)
        createModel()
      }

      //鼠标右键显示菜单
      const rightClick = () => {
        var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction(function (movement) {
          //设置监听方法
          var scene = viewer.scene;
          var pick = scene.pick(movement.position);
          if (pick == undefined) {
            console.log("空白处右键菜单");
          } else {
            showRightClickMenu.value = true
            console.log("实体处右键菜单，实体ID为：", pick);
            //把模型实体给全局
            entityModel = pick.id
            // console.log(scene.pickPosition(movement.position));

          }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
      }

      //获取鼠标位置
      const getMouseXY = (e) => {
        xPosition.value = e.pageX //获取鼠标的X坐标（鼠标与屏幕左侧的距离，单位为px）
        yPosition.value = e.pageY //获取鼠标的Y坐标（鼠标与屏幕顶部的距离，单位为px）
        console.log(xPosition.value + 'px');
        console.log(yPosition.value + 'px');
      }

      //高亮模型
      const heighLightModel = () => {
        console.log(entityModel);
        entityModel.model.color = new Cesium.Color(1, 0, 0, 1); //设置模型颜色与透明度
        //右键菜单不再显示
        showRightClickMenu.value = false
      }

      //调整模型
      const adjustModel = () => {
        showAdjustModel.value = true
        // console.log(headingValue)
        //航向、俯仰和滚动的方向
        let heading = ref(Cesium.Math.toRadians(headingValue.value))
        let pitch = ref(Cesium.Math.toRadians(pitchValue.value))
        let roll = ref(Cesium.Math.toRadians(rollValue.value))
        var hpr = reactive(new Cesium.HeadingPitchRoll(heading, pitch, roll))
        entityModel.orientation = new Cesium.Transforms.headingPitchRollQuaternion(
          entityModel.position._value,
          hpr
        )
        //右键菜单不再显示
        showRightClickMenu.value = false
      }

      //取消模型更改
      const cancelAdjust = () => {
        headingValue.value = 0
        pitchValue.value = 0
        rollValue.value = 0
        adjustModel()
        //关闭调整面板
        showAdjustModel.value = false
      }

      //机动计划
      const moveModel = () => {
        alert('请在地图上规划路线，左键标点，右键结束。')
        //删除原来的模型
          deleteModel()
        //需要的变量
        //数组
        let data = []
        let i = 0
        //机动计划结束时间
        let end
        //计算实体位置属性。
        let position

        //设置随机数种子以获得一致的结果.
        Cesium.Math.setRandomNumberSeed(3)

        // //设置模拟开始时间
        const start = Cesium.JulianDate.fromDate(new Date(2022, 5, 10, 16))

        var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
        
        //鼠标左键事件（只标点，不带线）
        //#region
        // handler.setInputAction(function (movement) {
        //   var position = viewer.scene.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
        //   //将笛卡尔坐标转化为经纬度坐标
        //   var cartographic = Cesium.Cartographic.fromCartesian(position);
        //   var longitude = Cesium.Math.toDegrees(cartographic.longitude);
        //   var latitude = Cesium.Math.toDegrees(cartographic.latitude);
        //   var height = cartographic.height;
        //   console.log(longitude, latitude, height)
        //   data[i] = cartographic
        //   data[i].longitude = longitude
        //   data[i].latitude = latitude
        //   data[i].height = height
        //   data[i].time = i * 90
        //   console.log(data[i])
        //   console.log(data)
        //   i++
        //   //标点
        //   viewer.entities.add({
        //     name: '机动计划标点',
        //     // fromDegrees（经度，纬度，高度，椭球，结果）从以度为单位的经度和纬度值返回Cartesian3位置
        //     position: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
        //     point: {
        //       pixelSize: 8,
        //       color: Cesium.Color.TRANSPARENT,
        //       outlineColor: Cesium.Color.YELLOW,
        //       outlineWidth: 3,
        //     }
        //   });
        // }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        //#endregion
        
        //标点带线
        let measureFeature_line = []
        let measureFeature_polygon = []
        measureLineSpace()
        clearMeasureFeature()

        function measureLineSpace() {
          var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
          // 取消双击事件-追踪该位置
          viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
            Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
          )

          handler = new Cesium.ScreenSpaceEventHandler(
            viewer.scene._imageryLayerCollection
          )
          var positions = []
          var poly = null
          var cartesian = null
          var floatingPoint

          //鼠标移动
          handler.setInputAction(function (movement) {
            const ray = viewer.camera.getPickRay(movement.endPosition)
            cartesian = viewer.scene.globe.pick(ray, viewer.scene)
            if (positions.length >= 2) {
              if (!Cesium.defined(poly)) {
                poly = new PolyLinePrimitive(positions)
              } else {
                positions.pop()
                positions.push(cartesian)
              }
            }
          }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

          //鼠标左键
          handler.setInputAction(function (movement) {
            var position = viewer.scene.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid)
            //将笛卡尔坐标转化为经纬度坐标
            var cartographic = Cesium.Cartographic.fromCartesian(position)
            var longitude = Cesium.Math.toDegrees(cartographic.longitude)
            var latitude = Cesium.Math.toDegrees(cartographic.latitude)
            var height = cartographic.height;
            console.log(longitude, latitude, height)
            data[i] = cartographic
            data[i].longitude = longitude
            data[i].latitude = latitude
            data[i].height = height
            data[i].time = i * 90
            console.log(data[i])
            console.log(data)
            i++
            const ray = viewer.camera.getPickRay(movement.position)
            cartesian = viewer.scene.globe.pick(ray, viewer.scene)
            if (positions.length == 0) {
              positions.push(cartesian.clone())
            }
            positions.push(cartesian)

            //标点
            floatingPoint = viewer.entities.add({
              name: '机动计划标点',
              position: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
              point: {
                pixelSize: 5,
                color: Cesium.Color.WHITE,
                // outlineColor: new Cesium.Color(1, 0, 0, 1),
                outlineColor: Cesium.Color.DEEPSKYBLUE,
                outlineWidth: 3
              }
            })
            measureFeature_line.push(floatingPoint)
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

          //鼠标右键
          handler.setInputAction(function (movement) {
            handler.destroy() // 关闭事件句柄
            positions.pop() // 最后一个点无效
            deleteModel()
            // viewer.entities.remove(floatingPoint);
          }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

          //鼠标移动调用的函数，生成连线
          var PolyLinePrimitive = (function () {
            function _(positions) {
              this.options = {
                name: '机动计划直线',
                polyline: {
                  show: true,
                  positions: [],
                  material: new Cesium.Color(0, 124 / 255, 247 / 255, 1),
                  // material: Cesium.Color.CHARTREUSE,
                  width: 3,
                  clampToGround: true
                }
              }
              this.positions = positions
              this._init()
            }

            _.prototype._init = function () {
              var _self = this
              var _update = function () {
                return _self.positions
              }
              // 实时更新polyline.positions
              this.options.polyline.positions = new Cesium.CallbackProperty(
                _update,
                false
              )
              const line = viewer.entities.add(this.options)
              measureFeature_line.push(line)
            }

            return _
          })()
          console.log(measureFeature_line, 'measureFeature_line')

        }

        //清除
        function clearMeasureFeature() {
          viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK)
          viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
          viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)
          if (measureFeature_line.length) {
            measureFeature_line.forEach(item => {
              viewer.entities.remove(item)
            })
            measureFeature_line = []
          }
          if (measureFeature_polygon.length) {
            measureFeature_polygon.forEach(item => {
              viewer.entities.remove(item)
            })
            measureFeature_polygon = []
          }
        }

        //右键结束加点，生成路线
        handler.setInputAction(function (movement) {
          removeEntityByName('机动计划直线')
          removeEntityByName('机动计划标点')
          //删除原来的模型
          // deleteModel()
          // 根据标点个数计算结束时间
          end = (i - 1) * 90
          //设置模拟时间的界限
          const stop = Cesium.JulianDate.addSeconds(
            start,
            end,
            new Cesium.JulianDate()
          )

          //确保查看者处于所需的时间。
          viewer.clock.startTime = start.clone()
          viewer.clock.stopTime = stop.clone()
          viewer.clock.currentTime = start.clone()
          viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP //Loop at the end
          viewer.clock.multiplier = 10 //乘数
          //将时间轴设置为模拟边界
          viewer.timeline.zoomTo(start, stop)
          // 获取经过处理的位置信息
          position = computeCirclularFlight(data)
          console.log('结束加点')
          // 关闭事件句柄
          handler.destroy()
          
          //实际创建实体
          const entity = viewer.entities.add({
            name:'机动计划',
            //将实体可用性设置为与模拟时间相同的时间间隔。
            availability: new Cesium.TimeIntervalCollection([
              new Cesium.TimeInterval({
                start: start,
                stop: stop,
              }),
            ]),

            //使用我们的计算位置
            position: position,

            //根据位置移动自动计算方向。
            orientation: new Cesium.VelocityOrientationProperty(position),

            //加载模型以表示实体
            model: {
              uri: store.state.chooseModel,
              minimumPixelSize: 128,
            },

            //将路径显示为以 1 秒为增量采样的黄色线条。
            path: {
              resolution: 1,
              //官网黄色的线
              // material: new Cesium.PolylineGlowMaterialProperty({
              //   glowPower: 0.1,
              //   color: Cesium.Color.YELLOW,
              // }),
              material: new Cesium.Color(0, 124 / 255, 247 / 255, 1),
              width: 3,
            },
          });
          return
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

        //右键事件的position调用的方法，生成具有不同高度的随机圆形图案
        function computeCirclularFlight(source) {
          const property = new Cesium.SampledPositionProperty()
          // 取样位置 相当于一个集合
          for (let i = 0; i < source.length; i++) {
            let time = Cesium.JulianDate.addSeconds(start, source[i].time, new Cesium.JulianDate)
            let position = Cesium.Cartesian3.fromDegrees(source[i].longitude, source[i].latitude, source[i].height)
            // 添加位置，和时间对应
            property.addSample(time, position)
            //还要为我们生成的每个样本创建一个点。
            viewer.entities.add({
              position: position,
              point: {
                //黄色标点
                // pixelSize: 8,
                // color: Cesium.Color.TRANSPARENT,
                // outlineColor: Cesium.Color.YELLOW,
                // outlineWidth: 3,
                pixelSize: 5,
                color: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.DEEPSKYBLUE,
                outlineWidth: 3
              },
            })
          }
          return property;
        }

        //右键菜单不再显示
        showRightClickMenu.value = false
      }

      //删除模型
      const deleteModel = () => {
        console.log(entityModel.id)
        //删除
        // viewer.entities.remove(floatingPoint)
        viewer.entities.remove(entityModel)
        // viewer.entities.remove(floatingPoint)
        
        //右键菜单不再显示
        showRightClickMenu.value = false
      }

      return {
        showMeasureChoose,
        showChoose,
        showRightClickMenu,
        showAdjustModel,
        headingValue,
        pitchValue,
        rollValue,
        xPosition,
        yPosition,
        entityModel,
        goMark,
        goMeasure,
        goModel,
        goClear,
        fly,
        options,
        toShowTable,
        getOption,
        value,
        rightClick,
        getMouseXY,
        heighLightModel,
        adjustModel,
        cancelAdjust,
        moveModel,
        deleteModel,
        modelLongitude,
        modelLatitude,
        modelHeight,
        measureDistance,
        measureArea,
        removeEntityByName
      }
    }
  }
</script>

<style scoped lang='less'>
  #map {
    .btn {
      position: absolute;
      top: 1vh;
      right: 4vw;
      cursor: pointer;
      z-index: 200;

      .iconfont {
        color: #fff;
        font-size: 2rem;
      }
    }

    // 功能面板
    .functionTable {
      display: flex;
      justify-content: space-around;
      position: absolute;
      top: 1vh;
      right: 7vw;
      width: 300px;
      height: 40px;
      background: rgba(29, 29, 31, 0.72);
      backdrop-filter: blur(6.5px);
      -webkit-backdrop-filter: blur(6.5px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      box-shadow: rgba(14, 14, 14, 0.19) 0px 6px 15px 0px;
      -webkit-box-shadow: rgba(14, 14, 14, 0.19) 0px 6px 15px 0px;
      border-radius: 10px;
      -webkit-border-radius: 10px;
      color: rgba(128, 128, 128, 0.6);
      z-index: 100;

      .iconfont {
        cursor: pointer;
        color: #fff;
        font-size: 2rem;
      }
    }

    //测量选择下拉菜单
    .measureTable {
      position: absolute;
      top: 10vh;
      right: 27vw;
      width: 10vw;
      z-index: 200;
    }

    //模型选择下拉菜单
    .modelsTable {
      position: absolute;
      top: 10vh;
      right: 16vw;
      width: 10vw;
      z-index: 200;
    }

    // 右键菜单
    .rightClick {
      position: fixed;
      width: 100px;
      height: 150px;
      background: rgba(29, 29, 31, 0.72);
      backdrop-filter: blur(6.5px);
      -webkit-backdrop-filter: blur(6.5px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      box-shadow: rgba(14, 14, 14, 0.19) 0px 6px 15px 0px;
      -webkit-box-shadow: rgba(14, 14, 14, 0.19) 0px 6px 15px 0px;
      border-radius: 10px;
      -webkit-border-radius: 10px;
      color: #fff;
      z-index: 100;

      ul {
        li {
          display: block;
          margin-top: 8px;
          cursor: pointer;
          font-size: 20px;
          text-align: center;
          text-decoration: none;
        }
      }
    }

    // 模型调整面板
    .adjustModelTable {
      position: fixed;
      top: 10vh;
      left: 10vw;
      padding: .625rem;
      width: 450px;
      // height: 350px;
      background: rgba(29, 29, 31, 0.72);
      backdrop-filter: blur(6.5px);
      -webkit-backdrop-filter: blur(6.5px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      box-shadow: rgba(14, 14, 14, 0.19) 0px 6px 15px 0px;
      -webkit-box-shadow: rgba(14, 14, 14, 0.19) 0px 6px 15px 0px;
      border-radius: 10px;
      -webkit-border-radius: 10px;
      color: #fff;
      z-index: 100;

      .slider-demo-block {
        display: flex;
        flex-direction: column;
        align-items: center;

        div {
          margin-top: 2vh;
        }

        .el-slider {
          margin-top: 2vh;
          margin-bottom: 3vh;
          // margin-left: 12px;
        }
      }

      // .cancel {
      //     margin-left: 30%;
      //     margin-right: 10%;
      // }
    }
  }
</style>