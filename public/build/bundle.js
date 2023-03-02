
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/Background.svelte generated by Svelte v3.31.2 */

    const file = "src/components/Background.svelte";

    function create_fragment(ctx) {
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let div3;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = space();
    			div3 = element("div");
    			attr_dev(div0, "class", "h-full w-8/12 absolute transform translate-x-1/2 right-1/2 bg-gray mx-auto");
    			add_location(div0, file, 0, 0, 0);
    			attr_dev(div1, "class", "h-full w-2/5 absolute transform translate-x-1/2 right-1/2 bg-gray mx-auto");
    			add_location(div1, file, 1, 0, 95);
    			attr_dev(div2, "class", "h-full w-full absolute transform translate-x-1/2 right-1/2 top-1/2 bg-white mx-auto");
    			add_location(div2, file, 2, 0, 189);
    			attr_dev(div3, "class", "h-52 w-full absolute transform translate-x-1/2 right-1/2 top-1/2 gradient mx-auto");
    			add_location(div3, file, 3, 0, 293);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div3, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Background", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Background> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Background extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Background",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/components/Card.svelte generated by Svelte v3.31.2 */

    const file$1 = "src/components/Card.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let h2;
    	let t1;
    	let t2;
    	let p0;
    	let t3;
    	let t4;
    	let p1;
    	let t5;
    	let t6;
    	let div1_class_value;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			h2 = element("h2");
    			t1 = text(/*title*/ ctx[1]);
    			t2 = space();
    			p0 = element("p");
    			t3 = text(/*description*/ ctx[2]);
    			t4 = space();
    			p1 = element("p");
    			t5 = text("By ");
    			t6 = text(/*authorName*/ ctx[3]);
    			attr_dev(img, "class", "w-full h-48 object-cover rounded-t-3xl");
    			if (img.src !== (img_src_value = /*imageSrc*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*title*/ ctx[1]);
    			add_location(img, file$1, 9, 4, 244);
    			attr_dev(h2, "class", "text-xl font-semibold mb-2");
    			add_location(h2, file$1, 11, 8, 365);
    			attr_dev(p0, "class", "text-gray-700");
    			add_location(p0, file$1, 12, 8, 425);
    			attr_dev(p1, "class", "text-gray-500 text-sm mt-2");
    			add_location(p1, file$1, 13, 8, 476);
    			attr_dev(div0, "class", "w-full p-6");
    			add_location(div0, file$1, 10, 4, 332);
    			attr_dev(div1, "class", div1_class_value = "bg-white rounded-3xl shadow-lg card-width z-20 " + (/*last*/ ctx[4] == "True" ? "mr-10" : ""));
    			add_location(div1, file$1, 8, 0, 143);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, h2);
    			append_dev(h2, t1);
    			append_dev(div0, t2);
    			append_dev(div0, p0);
    			append_dev(p0, t3);
    			append_dev(div0, t4);
    			append_dev(div0, p1);
    			append_dev(p1, t5);
    			append_dev(p1, t6);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*imageSrc*/ 1 && img.src !== (img_src_value = /*imageSrc*/ ctx[0])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*title*/ 2) {
    				attr_dev(img, "alt", /*title*/ ctx[1]);
    			}

    			if (dirty & /*title*/ 2) set_data_dev(t1, /*title*/ ctx[1]);
    			if (dirty & /*description*/ 4) set_data_dev(t3, /*description*/ ctx[2]);
    			if (dirty & /*authorName*/ 8) set_data_dev(t6, /*authorName*/ ctx[3]);

    			if (dirty & /*last*/ 16 && div1_class_value !== (div1_class_value = "bg-white rounded-3xl shadow-lg card-width z-20 " + (/*last*/ ctx[4] == "True" ? "mr-10" : ""))) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Card", slots, []);
    	let { imageSrc } = $$props;
    	let { title } = $$props;
    	let { description } = $$props;
    	let { authorName } = $$props;
    	let { last } = $$props;
    	const writable_props = ["imageSrc", "title", "description", "authorName", "last"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("imageSrc" in $$props) $$invalidate(0, imageSrc = $$props.imageSrc);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("description" in $$props) $$invalidate(2, description = $$props.description);
    		if ("authorName" in $$props) $$invalidate(3, authorName = $$props.authorName);
    		if ("last" in $$props) $$invalidate(4, last = $$props.last);
    	};

    	$$self.$capture_state = () => ({
    		imageSrc,
    		title,
    		description,
    		authorName,
    		last
    	});

    	$$self.$inject_state = $$props => {
    		if ("imageSrc" in $$props) $$invalidate(0, imageSrc = $$props.imageSrc);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("description" in $$props) $$invalidate(2, description = $$props.description);
    		if ("authorName" in $$props) $$invalidate(3, authorName = $$props.authorName);
    		if ("last" in $$props) $$invalidate(4, last = $$props.last);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [imageSrc, title, description, authorName, last];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			imageSrc: 0,
    			title: 1,
    			description: 2,
    			authorName: 3,
    			last: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*imageSrc*/ ctx[0] === undefined && !("imageSrc" in props)) {
    			console.warn("<Card> was created without expected prop 'imageSrc'");
    		}

    		if (/*title*/ ctx[1] === undefined && !("title" in props)) {
    			console.warn("<Card> was created without expected prop 'title'");
    		}

    		if (/*description*/ ctx[2] === undefined && !("description" in props)) {
    			console.warn("<Card> was created without expected prop 'description'");
    		}

    		if (/*authorName*/ ctx[3] === undefined && !("authorName" in props)) {
    			console.warn("<Card> was created without expected prop 'authorName'");
    		}

    		if (/*last*/ ctx[4] === undefined && !("last" in props)) {
    			console.warn("<Card> was created without expected prop 'last'");
    		}
    	}

    	get imageSrc() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imageSrc(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get description() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set description(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get authorName() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set authorName(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get last() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set last(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var CardsData = [{
        "imageSrc": "https://via.placeholder.com/400x200",
        "title": "Card 1",
        "description": "This is the first card.",
        "authorName": "John Doe"
    }, {
        "imageSrc": "https://via.placeholder.com/400x200",
        "title": "Card 2",
        "description": "This is the second card.",
        "authorName": "Jane Doe"
    }, {
        "imageSrc": "https://via.placeholder.com/400x200",
        "title": "Card 3",
        "description": "This is the third card.",
        "authorName": "Bob Smith"
    }];

    /* src/components/Cards.svelte generated by Svelte v3.31.2 */
    const file$2 = "src/components/Cards.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	child_ctx[2] = i;
    	return child_ctx;
    }

    // (7:4) {#each CardsData as card, i}
    function create_each_block(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				imageSrc: /*card*/ ctx[0].imageSrc,
    				title: /*card*/ ctx[0].title,
    				description: /*card*/ ctx[0].description,
    				authorName: /*card*/ ctx[0].authorName,
    				last: /*i*/ ctx[2] === CardsData.length - 1 ? "True" : "False"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(7:4) {#each CardsData as card, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let current;
    	let each_value = CardsData;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "flex w-screen overflow-x-auto gap-6 mt-20 ml-10 cards");
    			add_location(div, file$2, 5, 0, 102);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*CardsData*/ 0) {
    				each_value = CardsData;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Cards", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Cards> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Card, CardsData });
    	return [];
    }

    class Cards extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cards",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Logo.svelte generated by Svelte v3.31.2 */

    const file$3 = "src/components/Logo.svelte";

    function create_fragment$3(ctx) {
    	let svg;
    	let g0;
    	let path0;
    	let rect0;
    	let rect1;
    	let rect2;
    	let ellipse0;
    	let g1;
    	let rect3;
    	let g2;
    	let rect4;
    	let g3;
    	let ellipse1;
    	let path1;
    	let path2;
    	let ellipse2;
    	let ellipse3;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g0 = svg_element("g");
    			path0 = svg_element("path");
    			rect0 = svg_element("rect");
    			rect1 = svg_element("rect");
    			rect2 = svg_element("rect");
    			ellipse0 = svg_element("ellipse");
    			g1 = svg_element("g");
    			rect3 = svg_element("rect");
    			g2 = svg_element("g");
    			rect4 = svg_element("rect");
    			g3 = svg_element("g");
    			ellipse1 = svg_element("ellipse");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			ellipse2 = svg_element("ellipse");
    			ellipse3 = svg_element("ellipse");
    			attr_dev(path0, "d", "M1936 352.99C1936 158.039 2093.82 0 2288.5 0C2483.18 0 2641 158.039 2641 352.99C2288.5 352.99 2483.18 352.99 2288.5 352.99C2093.82 352.99 2288.5 352.99 1936 352.99Z");
    			attr_dev(path0, "fill", "#001D76");
    			add_location(path0, file$3, 2, 4, 192);
    			set_style(g0, "mix-blend-mode", "multiply");
    			add_location(g0, file$3, 1, 4, 152);
    			attr_dev(rect0, "x", "2338.89");
    			attr_dev(rect0, "y", "352.988");
    			attr_dev(rect0, "width", "302.065");
    			attr_dev(rect0, "height", "352.989");
    			attr_dev(rect0, "fill", "#003399");
    			add_location(rect0, file$3, 4, 4, 397);
    			attr_dev(rect1, "x", "1936");
    			attr_dev(rect1, "y", "352.988");
    			attr_dev(rect1, "width", "302.165");
    			attr_dev(rect1, "height", "352.989");
    			attr_dev(rect1, "fill", "#003399");
    			add_location(rect1, file$3, 5, 4, 481);
    			attr_dev(rect2, "x", "1583.14");
    			attr_dev(rect2, "width", "252.135");
    			attr_dev(rect2, "height", "705.979");
    			attr_dev(rect2, "fill", "#003399");
    			add_location(rect2, file$3, 6, 4, 562);
    			attr_dev(ellipse0, "cx", "1258.79");
    			attr_dev(ellipse0, "cy", "479.057");
    			attr_dev(ellipse0, "rx", "223.489");
    			attr_dev(ellipse0, "ry", "226.922");
    			attr_dev(ellipse0, "fill", "#8099CC");
    			add_location(ellipse0, file$3, 7, 4, 634);
    			attr_dev(rect3, "x", "999.244");
    			attr_dev(rect3, "width", "483.034");
    			attr_dev(rect3, "height", "201.708");
    			attr_dev(rect3, "fill", "#003399");
    			add_location(rect3, file$3, 9, 4, 756);
    			set_style(g1, "mix-blend-mode", "multiply");
    			add_location(g1, file$3, 8, 4, 716);
    			attr_dev(rect4, "x", "776.351");
    			attr_dev(rect4, "y", "504.271");
    			attr_dev(rect4, "width", "494.258");
    			attr_dev(rect4, "height", "201.708");
    			attr_dev(rect4, "fill", "#003399");
    			add_location(rect4, file$3, 12, 4, 877);
    			set_style(g2, "mix-blend-mode", "multiply");
    			add_location(g2, file$3, 11, 4, 837);
    			attr_dev(ellipse1, "cx", "999.839");
    			attr_dev(ellipse1, "cy", "226.922");
    			attr_dev(ellipse1, "rx", "223.489");
    			attr_dev(ellipse1, "ry", "226.922");
    			attr_dev(ellipse1, "fill", "#8099CC");
    			add_location(ellipse1, file$3, 15, 4, 1010);
    			set_style(g3, "mix-blend-mode", "multiply");
    			add_location(g3, file$3, 14, 4, 970);
    			attr_dev(path1, "d", "M777.722 202C792 79 894 0 1001 0V202H777.722Z");
    			attr_dev(path1, "fill", "#001F7A");
    			add_location(path1, file$3, 17, 4, 1101);
    			attr_dev(path2, "d", "M1481 504C1467.19 627 1368.51 706 1265 706V504H1481Z");
    			attr_dev(path2, "fill", "#001F7A");
    			add_location(path2, file$3, 18, 4, 1178);
    			attr_dev(ellipse2, "cx", "352.963");
    			attr_dev(ellipse2, "cy", "352.989");
    			attr_dev(ellipse2, "rx", "352.963");
    			attr_dev(ellipse2, "ry", "352.989");
    			attr_dev(ellipse2, "fill", "#003399");
    			add_location(ellipse2, file$3, 19, 4, 1262);
    			attr_dev(ellipse3, "cx", "352.963");
    			attr_dev(ellipse3, "cy", "352.99");
    			attr_dev(ellipse3, "rx", "126.058");
    			attr_dev(ellipse3, "ry", "126.068");
    			attr_dev(ellipse3, "fill", "#8099CC");
    			add_location(ellipse3, file$3, 20, 4, 1344);
    			attr_dev(svg, "class", "z-10 relative w-full h-auto px-6 pt-6");
    			attr_dev(svg, "width", "2641");
    			attr_dev(svg, "height", "706");
    			attr_dev(svg, "viewBox", "0 0 2641 706");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g0);
    			append_dev(g0, path0);
    			append_dev(svg, rect0);
    			append_dev(svg, rect1);
    			append_dev(svg, rect2);
    			append_dev(svg, ellipse0);
    			append_dev(svg, g1);
    			append_dev(g1, rect3);
    			append_dev(svg, g2);
    			append_dev(g2, rect4);
    			append_dev(svg, g3);
    			append_dev(g3, ellipse1);
    			append_dev(svg, path1);
    			append_dev(svg, path2);
    			append_dev(svg, ellipse2);
    			append_dev(svg, ellipse3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Logo", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Logo> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Logo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Logo",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.2 */
    const file$4 = "src/App.svelte";

    function create_fragment$4(ctx) {
    	let main;
    	let background;
    	let t0;
    	let logo;
    	let t1;
    	let cards;
    	let current;
    	background = new Background({ $$inline: true });
    	logo = new Logo({ $$inline: true });
    	cards = new Cards({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(background.$$.fragment);
    			t0 = space();
    			create_component(logo.$$.fragment);
    			t1 = space();
    			create_component(cards.$$.fragment);
    			attr_dev(main, "class", "container mx-auto flex justify-start items-center flex-col bg-gray h-full relative overflow-x-hidden");
    			add_location(main, file$4, 6, 0, 175);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(background, main, null);
    			append_dev(main, t0);
    			mount_component(logo, main, null);
    			append_dev(main, t1);
    			mount_component(cards, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(background.$$.fragment, local);
    			transition_in(logo.$$.fragment, local);
    			transition_in(cards.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(background.$$.fragment, local);
    			transition_out(logo.$$.fragment, local);
    			transition_out(cards.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(background);
    			destroy_component(logo);
    			destroy_component(cards);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Background, Cards, Logo });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
