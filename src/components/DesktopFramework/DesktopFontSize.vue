<template>
    <div class="flex-col">
		<div class="flex-1 flex-center posr">
			<div class="FULL list-ctn pdlr10">
				<div class="list-item mgtb2 pdtb2 flex-row w100p tcef" v-for="obj in fontSizeOptions" @click="onClickItem(obj.value)">
					<span>{{obj.value}}</span>
					<div class="flex-1" />
					<span class="radio-icon posr" :class="{selected: fontSizeRatio===obj.value}" />
				</div>
			</div>
		</div>
		<div class="flex-center mgtb5">
			<CheckBox v-model="$store.state.desktop.fontSizeToAll"><span class="mgl0d5">{{$ln('同步至所有版面')}}</span></CheckBox>
		</div>
		<div class="mgt5 mgb10 flex-row flex-center">
			<Button class="btn-cancel mgr5" @click="onRestore">{{$ln('复原')}}</Button>
			<Button class="btn-confirm mgl5" @click="onConfirm">{{$ln('确定')}}</Button>
		</div>
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {
		// 記下初始的字體(復原用)
		this.orginFontSizeRatio = this.fontSizeRatio;
		this.$emit('title', '调整字体大小');
	},
    mounted() {},
	beforeDestroy() {
		this.save();
	},
	components: {},
    methods: {
		onClickItem(num) {
			this.$store.state.desktop.fontSizeRatio = num;
			this.$set(this.selectedLayout, 'fontSizeRatio', num);
		},
		/** 復原 */
		onRestore() {
			this.onClickItem(this.orginFontSizeRatio);
		},
		/** 確定 */
		onConfirm() {
			this.save();
			eventBus.$emit("CLOSE-DIALOG");
		},
		/** 儲存 */
		save() {
			// 若有勾選同步至所有版面 -> 將字體大小更新至所有版面
			if (this.fontSizeToAll)
				this.$store.state.desktop.layout.forEach(obj=>{obj.fontSizeRatio = this.fontSizeRatio;});
		},
	},
	watch: {},
    computed: {
		fontSizeRatio() {
			return this.$store.state.desktop.fontSizeRatio;
		},
		fontSizeOptions() {
			return this.$store.state.desktop.fontSizeOptions;
		},
		fontSizeToAll() {
			return this.$store.state.desktop.fontSizeToAll;
		},
		selectedLayout() {
			return this.$store.state.desktop.selectedLayout;
		},
	},
}
</script>

<style scoped>
.list-ctn {
	overflow-y: auto;
	overflow-x: hidden;
}
.list-item {
	height: 2em;
	line-height: 2em;
	border-bottom: 1px solid #4e6c8d;
}
.radio-icon {
	border-radius: 100%;
    height: 13px;
    width: 13px;
    margin: auto;
    transition: border .25s linear;
    -webkit-transition: border .25s linear;	
}
.radio-icon:before {
    position: absolute;
    content: "";
    border-radius: 100%;
    height: 17px;
    width: 17px;
    margin: auto;
    transition: background .25s linear;
    border: 1px solid #fff;
    right: -3px;
	top: -3px;
}
.radio-icon.selected {
	background: rgba(255,152,0,.932);
}
</style>