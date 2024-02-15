<template>
    <div ref="chartCtn" class="FULL">
    </div>
</template>

<script>
import * as echarts from 'echarts';
export default {
	props: [],
	data() {
		return {
	        // 指定图表的配置项和数据
			option: {
				// 文字顏色
				textStyle: {
					color: 'white'
				},
				// 繪圖區
				grid: {
					top: 10,
					bottom: 25,
					right: 10,
				},
				// 資料移動與縮放
				dataZoom: [
					{
						type: 'inside',
						start: 0,
						end: 40
					}
				],
				// X 座標軸
				xAxis: {
					// 格線
					splitLine: {
						lineStyle: {
							color: '#333',
						}
					},
				},
				// Y 座標軸
				yAxis: {
					// 格線
					splitLine: {
						lineStyle: {
							color: '#333',
						}
					},
				},
				// 線圖
				series: [{
					name: 'PCR',
					type: 'line',
					showSymbol: false,
				}]
			}
		}
	},
	beforeMount() {
	},
    mounted() {
        // 基于准备好的dom，初始化echarts实例
        var myChart = echarts.init(this.$refs.chartCtn);
		this.option.xAxis.data = ["2020-01-01","2020-01-02","2020-01-03","2020-01-04","2020-01-05","2020-01-06","2020-01-07","2020-01-08","2020-01-09","2020-01-10","2020-01-11","2020-01-12","2020-01-13","2020-01-14","2020-01-15","2020-01-16","2020-01-17","2020-01-18","2020-01-19","2020-01-20","2020-01-21","2020-01-22","2020-01-23","2020-01-24"];
        this.option.series[0].data = [1.393,3.13,2.923,1.723,3.792,4.593,0.393,2.13,1.923,2.723,4.792,2.593,1.393,3.13,2.923,1.723,3.792,4.593,0.393,2.13,1.923,2.723,4.792,2.593];
        // 使用刚指定的配置项和数据显示图表。
		myChart.setOption(this.option);
	},
	beforeDestroy() {},
	components: {},
    methods: {},
	watch: {},
    computed: {},
}
</script>

<style scoped>
</style>