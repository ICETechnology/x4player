<template>
	<transition name="custom-classes-transition"
		enter-active-class="animated faster slideInRight"
		leave-active-class="animated faster slideOutRight">
		<div class="slide-up-ctn flex-column" :class="bindCtnClass()">
			<div class="head flex-row" v-if="showUp" @click="onClickHead">
				<div class="flex-1"></div>
				<span class="icon-btn flex-center"><i class="material-icons">expand_more</i></span>
			</div>
			<div class="body flex-1 flex-column" @click="onClickBody">
				<slot></slot>
			</div>
		</div>
	</transition>
</template>

<script>
export default {
	props: ['propShowUp'],
	data() {
		return {
			showUp: this.propShowUp,
        }
	},
	beforeMount() {
	},
    mounted() {
    },
	beforeDestroy() {
	},
	components: {
	},
    methods: {
		onClickHead() {
			if (this.showUp)
				this.showUp = !this.showUp;
		},
		onClickBody() {
			if (!this.showUp)
				this.showUp = !this.showUp;
		},
		bindCtnClass() {
			return this.showUp ? 'show-up' : '';
		},

	},
	watch: {
	},
    computed: {
    }
}
</script>

<style scoped>
.slide-up-ctn {
	-webkit-transition: height 0.2s linear;
    -moz-transition: height 0.2s linear;
    -o-transition: height 0.2s linear;
    transition: height 0.2s linear;
}
.show-up {
	height: 300px;	
}
.head {
	height: 3em;
	background-color: #111;
}
.icon-btn {
	margin-right: 10px;
}
.body {

}
</style>