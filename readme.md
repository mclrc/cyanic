## Cyanicjs

Tiny, zero-dependency reactive view library inspired by Vue

##### Features
- Robust Vue-like reactivity system with automated dependency tracking and a top level API
- Included basic HTML parser and template compiler with support for basic directives
- Reusable stateful components defined with a functional API similar to Vue 3's `setup`
- Basic VDOM implementation
- No external runtime dependencies
- Less than 1000 lines of code, ~10kb minified runtime

##### Roadmap
- Two-way data binding
- Compiler optimizations & static tree detection
- JSX support (already present in theory, API is just horrible)
- Event bus
- Block tree implementation (possibly)

This library is a work in progress with a lot of inefficiencies and bugs to iron out. It was created for the purpose of gaining a better understanding about the inner workings of other frontend frameworks. __Do not use this for serious projects.__

##### Example
```ts
import Cyanic, { ref, useProps, useHook, computed, useTemplate, useComponents } from 'visiejs'

const counter = () => {
	useTemplate(`<p>
									{{displayString}}
									<button @click="isRunning.value ? stop() : start()">
										{{isRunning.value ? 'Stop' : 'Start'}}
									</button>
								</p>`)

	const count = ref(0)
	const displayString = computed<string>(() => `${Math.floor(count.value / 60)}m ${count.value % 60}s`)
	
	const intervalId = ref(null)
	const isRunning = computed<boolean>(() => intervalId.value != null)

	const start = () => intervalId.value = setInterval(() => count.value++, 1000)
	const stop = () => { clearInterval(intervalId.value); intervalId.value = null }

	useHook('mounted', start)

	return { count, displayString, start, stop, isRunning }
}

new Cyanic(counter).$mount('#app')
```

##### Installation

For now, you'll have to install manually with `git clone https://github.com/pixldemon/cyanic/ && cd cyanic && npm run build`.
You can then install Cyanic in your project directory with `npm i path/to/cyanic/`, which will create a symlink to the installation in `node_modules`.

NPM release coming soon.