<template>
	<div class="FULL drag-column flex-col" :class="[columnKey]">
		<div class="flex-row font-size-micro">
			<div class="flex-1 flex-center clr-gray2 mgl3">{{$ln('显示栏位')}}</div>
			<div class="flex-1 flex-center clr-gray2 mgl3">{{$ln('隐藏栏位')}}</div>
		</div>
		<div class="flex-1 font-size-small posr">
			<div class="FULL flex-row" :class="{'font-size-mini': useSmallFont}">
				<div class="flex-1 flex-top list-ctn mglr3">
					<draggable v-model="showList" v-bind="dragOptions" @start="drag=true" @end="drag=false" 
						class="row wrap justify-space-around">
						<transition-group type="transition" name="flip-list">
							<div class="item bgc-head flex-row" v-for="(obj, idx) in showList" :key="obj.key">
								<div class="mgl1 flex-center" @click="onRemoveItem(obj, idx)"><i class="material-icons tcef">remove_circle</i></div>
								<div class="flex-1 flex-center pdlr3 label">{{$ln(obj.label)}}</div>
								<div class="mgr1 flex-center"><i class="material-icons">menu</i></div>
							</div>
						</transition-group>
					</draggable>
				</div>
				<div class="flex-1 flex-top list-ctn mglr3">
					<draggable v-model="hideList" v-bind="dragOptions" @start="drag=true" @end="drag=false"
						class="row wrap justify-space-around">
						<transition-group type="transition" name="flip-list">
							<div class="item bgc-head flex-row" v-for="(obj, idx) in hideList" :key="obj.key">
								<div class="mgl1 flex-center" @click="onAppendItem(obj, idx)"><i class="material-icons tcef">add_circle</i></div>
								<div class="flex-1 flex-center pdlr3 label">{{$ln(obj.label)}}</div>
							</div>
						</transition-group>
					</draggable>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import draggable from 'vuedraggable'
export default {
	props: ['columnKey'],
	data() {
		return {
			drag: false,
			dragOptions: {
				animation: 200,
				group: "description",
				disabled: false,
				ghostClass: "ghost"
			},
		}
	},
	beforeMount() {
	},
    mounted() {},
	beforeDestroy() {},
	components: {draggable},
    methods: {
		onAppendItem(obj, idx) {
			this.columnSD[this.columnKey].hide.splice(idx, 1);
			this.columnSD[this.columnKey].show.push(obj);
		},
		onRemoveItem(obj, idx) {
			this.columnSD[this.columnKey].show.splice(idx, 1);
			this.columnSD[this.columnKey].hide.push(obj);
		},
	},
	watch: {},
    computed: {
		columnSD() {
			return this.$store.state.columnSD;
		},
		showList: {
			get: function () {
				return this.columnSD[this.columnKey].show;
			},
			set: function (nv) {
				this.columnSD[this.columnKey].show = nv;
			},
		},
		hideList: {
			get: function () {
				return this.columnSD[this.columnKey].hide;
			},
			set: function (nv) {
				this.columnSD[this.columnKey].hide = nv;
			},
		},
		useSmallFont() {
			return this.columnKey === 'position';
		},
	},
}
</script>

<style scoped>
.list-ctn {
	/* border: 1px solid #222;
	border-radius: 0.5em; */
	overflow-y: auto;
	height: 100%;
}
.drag-column {
	/* background-color: black; */
	z-index: 99;
}
.item {
	margin: 0.5em;
	border: 1px solid #3E4D62;
	border-radius: 2px;
	width: 10em;
}
.position .item {
	width: 11em;
}
</style>