<template>
    <div class="" v-waypoint="{active: true, callback: onWaypoint}">
		
    </div>
</template>

<script>
/** 滾動監聽 */
import Vue from 'vue';
import VueWaypoint from 'vue-waypoint'
export default {
	props: ['obj'],
	data() {
		return {
			visibility: false,
		}
	},
	beforeMount() {
		Vue.use(VueWaypoint);
	},
    mounted() {},
	beforeDestroy() {
		if (this.visibility) {
			// console.log('OptionTStrikeSub.sub(unsub)', this.sidC, this.sidP);
			M4C.Quote.unsub(this.sidC, this);
			M4C.Quote.unsub(this.sidP, this);
		}
	},
	components: {},
    methods: {
		/** 滾動監聽 */
		onWaypoint({going, direction}) {
			this.visibility = going === 'in';
			// console.log('OptionTStrikeSub.visibility', this.sidC, this.sidP, this.visibility);
		},
	},
	watch: {
		visibility(nv) {
			if (nv) {
				// console.log('OptionTStrikeSub.sub(sub)', this.sidC, this.sidP);
				M4C.Quote.sub(this.sidC, this);
				M4C.Quote.sub(this.sidP, this);
			}
			else {
				// console.log('OptionTStrikeSub.sub(unsub)', this.sidC, this.sidP);
				M4C.Quote.unsub(this.sidC, this);
				M4C.Quote.unsub(this.sidP, this);
			}
		}
	},
    computed: {
		sidC() {
			return this.obj.sid;
		},
		sidP() {
			return this.obj.sid.replace('.C.', '.P.');
		},
	},
}
</script>

<style scoped>
</style>