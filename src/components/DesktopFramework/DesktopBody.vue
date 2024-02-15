<template>
    <div class="desktop-body-ctn posr">
		<!-- 拖曳四向容器 -->
		<DesktopDrag4 />
		<!-- <div class="FULL flex-top-left pointer-events-none"><pre class="json-ctn">{{jsonLayout}}</pre></div> -->
		<DesktopContainer :param="layout" />
    </div>
</template>

<script>

export default {
	props: ['layout'],
	data() {
		return {
			// jsonLayout: '',
		}
	},
	beforeMount() {
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {},
	watch: {
		// /** 監聽 layout 物件 */
		// layout: {
		// 	deep: true,
		// 	handler(nv) {
		// 		this.jsonLayout = JSON.stringify(this.layout, null, '\t');
		// 	}
		// }
	},
    computed: {},
}
</script>

<style scoped>
.json-ctn {
	border: 1px solid #444;
	padding: 4px;
	border-radius: 5px;
}
</style>