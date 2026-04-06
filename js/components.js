const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ===========================
Small Utilities 
=========================== */

const setAttrs = (el, attrs = {}) => {
	Object.entries(attrs).forEach(([k, v]) => {
		if (v === undefined || v === null || v === false) return;
		if (k === 'class') el.className = v;
		else el.setAttribute(k, String(v));
	});
	return el;
};
const create = (tag, attrs = {}, html) => {
	const el = document.createElement(tag);
	setAttrs(el, attrs);
	if (html !== undefined && html !== null) el.innerHTML = html;
	return el;
};

// Decode if URI-encoded; otherwise pass through
const safeDecode = (s) => {
	try {
		return decodeURIComponent(s);
	} catch {
		return s;
	}
};

// Turn "first%20name" -> "First Name"
const ucWords = (s) =>
	safeDecode(String(s))
	.toLowerCase()
	.replace(/\b\w/g, (c) => c.toUpperCase());

// Event delegation
const delegate = (root, selector, type, handler, options) => {
	root.addEventListener(
		type,
		e => {
			const target = e.target.closest(selector);
			if (target && root.contains(target)) handler(e, target);
		},
		options
	);
};

// JSON attribute helpers
const getJSONAttr = (el, name) => {
	const v = el.getAttribute(name);
	if (!v) return null;
	try {
		return JSON.parse(v);
	} catch {
		return null;
	}
};
const setJSONAttr = (el, name, obj) => el.setAttribute(name, JSON.stringify(obj));
const fire = (el, name, detail) => el.dispatchEvent(new CustomEvent(name, {
	bubbles: true,
	detail
}));
const focusFirst = (root) => {
	const focusables = root.querySelectorAll(
		'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
	);
	for (const f of focusables) {
		if (!f.disabled && f.offsetParent !== null) {
			f.focus();
			return;
		}
	}
};
const show = (el) => {
	el.style.display = '';
};
const hide = (el) => {
	el.style.display = 'none';
};
const viewportOffset = (el) => {
	const r = el.getBoundingClientRect();
	return {
		left: r.left,
		top: r.top
	};
};
const positionedOffset = (el) => {
	const r = el.getBoundingClientRect();
	return {
		left: r.left + window.scrollX,
		top: r.top + window.scrollY
	};
};
const pointer = (e) => ({
	x: e.pageX,
	y: e.pageY
});

// https://gist.github.com/jherax/8781f45dcd068a9e3e37
var sortElementsBy = (function() {

	var _toString = Object.prototype.toString,
		//the default parser function
		_parser = function(x) {
			return x;
		},
		//gets the item to be sorted
		_getItem = function(x) {
			var isObject = x != null && typeof x === "object";
			var isProp = isObject && this.prop in x;
			return this.parser(isProp ? x[this.prop] : x);
			//return this.parser((x !== null && typeof x === "object" && x[this.prop]) || x);
		};

	/* PROTOTYPE VERSION */
	// Creates the sort method in the Array prototype
	Object.defineProperty(Array.prototype, "sortElementsBy", {
		configurable: false,
		enumerable: false,
		// @o.prop: property name (if it is an Array of objects)
		// @o.desc: determines whether the sort is descending
		// @o.parser: function to parse the items to expected type
		value: function(o) {
			if (_toString.call(o) !== "[object Object]")
				o = {};
			if (typeof o.parser !== "function")
				o.parser = _parser;
			o.desc = !!o.desc ? -1 : 1;
			return this.sort(function(a, b) {
				a = _getItem.call(o, a);
				b = _getItem.call(o, b);
				return o.desc * (a < b ? -1 : +(a > b));
				//return ((a > b) - (b > a)) * o.desc;
			});
		}
	});

	/* FUNCTION VERSION */
	// Sorts the elements of an array
	// @array: the Array
	// @o.prop: property name (if it is an Array of objects)
	// @o.desc: determines whether the sort is descending
	// @o.parser: function to parse the items to expected type
	return function(array, o) {
		if (!(array instanceof Array) || !array.length)
			return [];
		if (_toString.call(o) !== "[object Object]")
			o = {};
		if (typeof o.parser !== "function")
			o.parser = _parser;
		o.desc = !!o.desc ? -1 : 1;
		return array.sort(function(a, b) {
			a = _getItem.call(o, a);
			b = _getItem.call(o, b);
			return o.desc * (a < b ? -1 : +(a > b));
		});
	};
}());

/* ================
Global state
================ */
let has_focus = true;
let windowObjectReference = null;
let dataTableOffset = 100;
let timer = 7000;
let alertTimer;

/* ================
DOM Ready
================ */
document.addEventListener('DOMContentLoaded', () => {
	// Setup global components
	setupComponents(document.body);
});

window.addEventListener('blur', () => {
	has_focus = false;
});
window.addEventListener('focus', () => {
	has_focus = true;
});

window.addEventListener('mousedown', (e) => {
	// Close context menu when clicking outside it
	if (!e.target.closest('div.contextMenu')) {
		$$('div.contextMenu').forEach(hide);
	}
});

/* ===========================
Messagebox
=========================== */

function Messagebox(message) {
	// Create messagebox
	const messagebox = create('div', {
		class: 'alert messagebox',
		id: 'Messagebox',
		role: 'alert',
		'aria-live': 'assertive',
		tabindex: '-1',
	});

	document.body.insertBefore(messagebox, document.body.firstChild);

	const errorPrefix =
		'<i class="fa fa-times-circle" aria-hidden="true"></i><span class="visually-hidden">Error: </span>';
	const successPrefix =
		'<i class="fa fa-check" aria-hidden="true"></i><span class="visually-hidden">Success: </span>';

	// error array
	if (Array.isArray(message?.error)) {
		message.error.forEach((msg) => {
			messagebox.appendChild(create('div', {
				class: 'errorText'
			}, errorPrefix + msg));
		});
	}
	// error string
	if (typeof message?.error === 'string') {
		messagebox.appendChild(create('div', {
			class: 'errorText'
		}, errorPrefix + message.error));
	}
	// success array
	if (Array.isArray(message?.success)) {
		message.success.forEach((msg) => {
			messagebox.appendChild(create('div', {
				class: 'successText'
			}, successPrefix + msg));
		});
	}
	// success string
	if (typeof message?.success === 'string') {
		messagebox.appendChild(create('div', {
			class: 'successText'
		}, successPrefix + message.success));
	}
	// blank string
	if (typeof message?.blank === 'string') {
		messagebox.appendChild(create('div', {
			class: 'successText'
		}, message.blank));
	}

	window.scrollTo(0, 0);
	messagebox.focus();

	const dismiss = () => {
		if (messagebox.isConnected) messagebox.remove();
		if (alertTimer) clearTimeout(alertTimer);
	};

	messagebox.addEventListener('click', dismiss);
	messagebox.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') dismiss();
	});

	alertTimer = setTimeout(dismiss, timer);
}

/* ===========================
AJAX helper (fetch wrapper)
=========================== */

async function ajaxRequest(url, {
	method = 'GET',
	parameters = null, // object
	body = null, // object or FormData
	headers = {},
	onCreate,
	onSuccess,
	onFailure,
} = {}) {
	try {
		onCreate && onCreate();

		let finalUrl = url;
		if (parameters && method.toUpperCase() === 'GET') {
			const usp = new URLSearchParams(parameters);
			finalUrl += (finalUrl.includes('?') ? '&' : '?') + usp.toString();
		}

		const init = {
			method,
			headers: {
				...headers
			}
		};
		if (method.toUpperCase() !== 'GET') {
			if (body instanceof FormData) {
				init.body = body;
			} else if (body && typeof body === 'object') {
				// default to URL-encoded like many legacy backends expect
				init.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
				init.body = new URLSearchParams(body).toString();
			}
		}

		const res = await fetch(finalUrl, init);
		const text = await res.text();
		let json = null;
		try {
			json = JSON.parse(text);
		} catch {
			/* ignore */ }

		const transport = {
			responseText: text,
			responseJSON: json,
			status: res.status,
			statusText: res.statusText,
			ok: res.ok,
		};

		if (res.ok) onSuccess && onSuccess(transport);
		else onFailure && onFailure(transport);
	} catch (err) {
		onFailure && onFailure({
			status: 0,
			statusText: String(err)
		});
	}
}

/* ===========================
setupComponents 
=========================== */

function setupComponents(element) {
	const root = element instanceof Element ? element : document.body;

	let showFirstTab = 0;
	const keyNavContainers = [];

	// Modals
	$$('.modal', root).forEach((modal) => {
		Object.assign(modal, ModalExt);
		// make focusable if not semantic
		if (!/^(A|BUTTON|INPUT)$/.test(modal.nodeName)) {
			modal.setAttribute('tabindex', '0');
			modal.addEventListener('keydown', (event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					modal.init();
				}
			});
		}
		modal.addEventListener('click', modal.init.bind(modal));
	});

	// Tabs
	$$('div.tabs span.tab, div.vtabs div.vtab, div.tabs select.tab', root).forEach((tab) => {
		Object.assign(tab, TabsExt);

		const tabContainer = tab.closest('div.tabs') || tab.closest('div.vtabs');

		if (tabContainer && !keyNavContainers.includes(tabContainer)) {
			TabsExt.setupKeyNavigation(tabContainer);
			keyNavContainers.push(tabContainer);
		}

		const dataUrl = tab.getAttribute('data-url') || '';
		tab.setAttribute('role', 'tab');
		tab.setAttribute('aria-controls', dataUrl.replace(/[^a-zA-Z0-9]/g, '-'));
		tab.setAttribute('tabindex', '-1');

		if (tab.nodeName === 'SPAN' || tab.nodeName === 'DIV') {
			tab.addEventListener('click', tab.loadTab.bind(tab));
		} else if (tab.nodeName === 'SELECT') {
			tab.addEventListener('change', function() {
				const selectedOption = this.options[this.selectedIndex];
				TabsExt.loadTab.call(selectedOption, selectedOption.getAttribute('data-url'));
			});
		}

		const refresh = parseInt(tab.getAttribute('data-refresh') || '0', 10);

		if (!showFirstTab && (tab.nodeName === 'SPAN' || tab.nodeName === 'DIV')) {
			showFirstTab = 1;
			tab.loadTab();
		}

		if (refresh > 0) {
			tab.pe = setInterval(() => {
				if (has_focus && tab.classList.contains('selected')) {
					tab.loadTab(tab.refreshArgs, 1);
				}
			}, refresh * 1000); // Assuming 'data-refresh' was seconds (Prototype PeriodicalExecuter)
		}
	});

	// DataTables
	$$('table.dataTable', root).forEach((table) => {
		Object.assign(table, DataTableExt);
		table.init();
	});

	// Tooltips as Messagebox
	$$('.tooltip', root).forEach((toolTip) => {
		if (!/^(A|BUTTON|INPUT)$/.test(toolTip.nodeName)) {
			toolTip.setAttribute('tabindex', '0');
		}
		const trigger = () => {
			Messagebox({
				blank: toolTip.getAttribute('data-tooltip')
			});
		};
		toolTip.addEventListener('click', trigger);
		toolTip.addEventListener('keydown', (event) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				trigger();
			}
		});
	});

	// Setup local components if provided
	if (typeof window.setupLocalComponents === 'function') {
		window.setupLocalComponents(root);
	}
}

/* ===========================
AjaxFormExt 
=========================== */

const AjaxFormExt = {
	observeSubmit() {
		const form = this;
		const refreshTable = form.getAttribute('data-refresh-table') || false;
		const refreshTab = form.getAttribute('data-refresh-tab') || false;

		form.addEventListener('submit', (event) => {
			event.preventDefault();

			ajaxRequest(form.action || window.location.href, {
				method: form.method?.toUpperCase() || 'POST',
				body: new FormData(form),
				onCreate: () => {
					const modalWindow = $('#modalWindow');
					if (modalWindow) ModalExt.kill();
				},
				onSuccess: (transport) => {
					form.reset();
					focusFirst(form);

					const result = transport.responseJSON ?? {};
					Messagebox(result);

					if (refreshTab) {
						const t = $(refreshTab);
						if (t && typeof t.loadTab === 'function') t.loadTab();
					} else if (refreshTable) {
						const tbl = $(refreshTable);
						if (tbl && typeof tbl.refreshData === 'function') tbl.refreshData();
					}
				},
				onFailure: () => {
					Messagebox({
						error: 'An unspecified error occured.'
					});
				},
			});
		});
	},
};

/* ===========================
ModalExt 
=========================== */

const ModalExt = {
	init() {
		const modal = this;
		const args = getJSONAttr(modal, 'data-args') || {};
		const dataTableControls = modal.closest('div.dataTableControls');
		const table = dataTableControls ?
			dataTableControls.previousElementSibling?.querySelector('.dataTable') :
			null;

		const tableArgs = table ? getJSONAttr(table, 'data-args') || {} : {};
		const tableSelectArgs = table ? getJSONAttr(table, 'data-select') || {} : {};

		Object.assign(args, tableArgs, tableSelectArgs, {
			action: modal.getAttribute('data-action')
		});

		const url = modal.getAttribute('data-url');
		ajaxRequest(url, {
			method: 'GET',
			parameters: args,
			onSuccess: (transport) => {
				const result = transport.responseText;
				ModalExt.display.call(modal, result, table);
			},
		});
	},

	display(data, table) {
		window.scrollTo(0, 0);

		// Background + Window
		const bg = create('div', {
			id: 'modalBackground'
		});
		const win = create('div', {
			id: 'modalWindow',
			role: 'dialog',
			'aria-modal': 'true'
		}, data);

		bg.addEventListener('click', ModalExt.kill);
		document.body.insertBefore(bg, document.body.firstChild);
		document.body.insertBefore(win, document.body.firstChild);

		const content = $('content', win);
		const form = $('form', win);
		let controls = $('controls', win);
		const titlebar = $('titlebar', win);

		if (form && table) form.setAttribute('data-refresh-table', table.id);

		if (!controls) {
			controls = create('controls');
			win.appendChild(controls);
		}

		// Set maximum height
		if (content && controls && titlebar) {
			const maxH = window.innerHeight - controls.getBoundingClientRect().height - titlebar.getBoundingClientRect().height - 35;
			content.style.maxHeight = `${maxH}px`;
		}

		// Add expand control
		if (titlebar && !$('.expand', titlebar)) {
			const expand = create('span', {
				class: 'expand',
				'data-style': 'expand',
				'aria-label': 'Toggle maximize',
			}, '<i class="fa fa-expand" aria-hidden="true"></i>');
			titlebar.appendChild(expand);
		}

		// Add close button if missing
		if (!$('input.close', controls)) {
			const closeButton = create('input', {
				type: 'button',
				class: 'close',
				'aria-label': 'Close modal'
			});
			closeButton.value = 'Close';
			controls.appendChild(closeButton);
		}

		// Observe close
		$('input.close', controls)?.addEventListener('click', ModalExt.kill);

		// Escape key to close (store handler so we can remove later)
		const keyHandler = (e) => {
			if (e.key === 'Escape') ModalExt.kill();
		};
		document.addEventListener('keydown', keyHandler);
		document.__modalKeyHandler = keyHandler;

		// Drag, expand, inner components
		ModalExt.dragHook();
		ModalExt.observeExpand(titlebar);
		setupComponents($('#modalWindow'));

		// Initial focus
		if ($('#modalWindow form')) focusFirst($('#modalWindow form'));
		else focusFirst($('#modalWindow'));

		fire($('#modalWindow'), ':modalLoaded');
	},

	kill() {
		const win = $('#modalWindow');
		const bg = $('#modalBackground');
		if (win) win.remove();
		if (bg) bg.remove();

		// Remove keydown handler
		if (document.__modalKeyHandler) {
			document.removeEventListener('keydown', document.__modalKeyHandler);
			delete document.__modalKeyHandler;
		}
	},

	dragHook() {
		const win = $('#modalWindow');
		if (!win) return;
		const titlebar = $('titlebar', win);
		if (!titlebar) return;

		let dragging = false;
		let offset = {
			x: 0,
			y: 0
		};
		let modalPosition = viewportOffset(win);

		titlebar.addEventListener('mousedown', (startEvent) => {
			dragging = true;
			const pos = win.getBoundingClientRect();
			modalPosition = {
				left: pos.left,
				top: pos.top
			};
			offset = {
				x: startEvent.clientX - pos.left,
				y: startEvent.clientY - pos.top
			};
			startEvent.preventDefault();
		});

		titlebar.addEventListener('mousemove', (moveEvent) => {
			if (!dragging) return;
			const cursor = {
				x: moveEvent.clientX,
				y: moveEvent.clientY
			};
			ModalExt.updatePosition(offset, modalPosition, cursor);
		});

		window.addEventListener('mouseup', () => {
			dragging = false;
		});
	},

	updatePosition(offset, modalPosition, cursorPosition) {
		const top = Math.max(cursorPosition.y - offset.y, 0);
		const left = Math.max(cursorPosition.x - offset.x, 0);
		const win = $('#modalWindow');
		if (!win) return;
		Object.assign(win.style, {
			position: 'absolute',
			top: `${top}px`,
			left: `${left}px`,
			transform: 'none',
			WebkitTransform: 'none',
		});
	},

	observeExpand(titlebar) {
		if (!titlebar) return;
		const win = $('#modalWindow');
		const controls = $('controls', win);
		const content = $('content', win);
		const expand = $('.expand', titlebar);
		if (!expand) return;

		expand.addEventListener('click', function() {
			const isExpand = /expand/.test(this.getAttribute('data-style') || '');
			if (isExpand) {
				this.innerHTML = '<i class="fa fa-compress" aria-hidden="true"></i>';
				this.setAttribute('data-style', 'compress');
				this.setAttribute('aria-label', 'Toggle minimize');
				Object.assign(win.style, {
					position: 'absolute',
					width: '99.4%',
					height: '99%',
					top: '2px',
					left: '2px',
					transform: 'none',
					WebkitTransform: 'none',
				});
				if (content && controls && titlebar) {
					content.style.height = `${win.getBoundingClientRect().height - controls.getBoundingClientRect().height - titlebar.getBoundingClientRect().height - 25}px`;
					Object.assign(controls.style, {
						position: 'absolute',
						bottom: '0',
						width: `${titlebar.getBoundingClientRect().width - 20}px`,
					});
				}
			} else {
				this.innerHTML = '<i class="fa fa-expand" aria-hidden="true"></i>';
				this.setAttribute('data-style', 'expand');
				this.setAttribute('aria-label', 'Toggle maximize');
				win.removeAttribute('style');
				controls && controls.removeAttribute('style');
			}
		});
	},
};

/* ===========================
DataTableExt 
=========================== */

const DataTableExt = {
	tableData: {},
	init(argsIn) {
		const table = this;
		const dataTableContainer = table.closest('div.dataTableContainer');
		const dataTableControls = dataTableContainer?.parentElement?.querySelector(':scope > div.dataTableControls');
		const search = dataTableControls ? ($("input[type='search']", dataTableControls) || $('input.search', dataTableControls)) : null;
		const url = table.getAttribute('data-url');
		const tableStatus = dataTableContainer ? dataTableContainer.nextElementSibling?.matches('div.dataTableStatus') ? dataTableContainer.nextElementSibling : null : null;
		const dataArgs = getJSONAttr(table, 'data-args') || {};
		const toggleHeaders = table.getAttribute('toggle-headers') || false;
		const toggleHighlight = table.getAttribute('toggle-highlight') || false;
		const form = dataTableContainer?.closest('form') || null;
		const args = argsIn ? {
			...dataArgs,
			...argsIn
		} : {
			...dataArgs
		};

		// Disable controls
		if (dataTableControls) {
			$$('input.select-enabled', dataTableControls).forEach((inp) => (inp.disabled = true));
		}

		// Setup hidden input container for selection
		const selectId = `${table.id}|select`;
		if (form && !$(`#${CSS.escape(selectId)}`, dataTableContainer)) {
			dataTableContainer.insertBefore(create('div', {
				id: selectId
			}), dataTableContainer.firstChild);
		}

		// Retrieve table data
		ajaxRequest(url, {
			method: 'GET',
			parameters: args,
			onCreate: () => {
				tableStatus?.querySelector('table td.dataTableRecords')?.replaceChildren(
					document.createTextNode('Loading table data...')
				);
			},
			onSuccess: (transport) => {
				const result = transport.responseJSON || {};
				if (result.caption) this.displayCaption(result.caption);
				table.tableData = result.data || [];
				const dataAttributes = !!result.dataAttributes;

				// Ensure th scope
				$$('thead th', table).forEach((th) => th.setAttribute('scope', 'col'));

				this.displayData(0, dataAttributes);
				this.displayPagination();
				this.resizeHook();
				this.selectHook();
				if (!table.hasAttribute('sortable')) {
					this.sortHook();
				}
				this.clearSelectionHook();
				this.clearHotkeyHook();
				if (dataTableControls) this.ajaxHook();
				if (search) this.searchHook();
				if (toggleHighlight) this.toggleHighlightHook();
			},
			onFailure: (transport) => {
				const cell = tableStatus?.querySelector('table td.dataTableRecords');
				if (cell) {
					cell.textContent = `Failed to retrieve data. ${transport.status} ${transport.statusText}`;
					cell.classList.add('errorText');
				}
			},
		});
	},

	refreshData(argsIn) {
		const table = this;
		const dataTableContainer = table.closest('div.dataTableContainer');
		const controls = dataTableContainer ? dataTableContainer.nextElementSibling?.matches('div.dataTableControls') ? dataTableContainer.nextElementSibling : null : null;
		const url = table.getAttribute('data-url');
		const tableStatus = dataTableContainer ? dataTableContainer.nextElementSibling?.matches('div.dataTableStatus') ? dataTableContainer.nextElementSibling : null : null;
		const dataArgs = getJSONAttr(table, 'data-args') || {};
		const form = dataTableContainer?.closest('form') || null;
		const args = argsIn ? {
			...dataArgs,
			...argsIn
		} : {
			...dataArgs
		};

		if (controls) $$('input.select-enabled', controls).forEach((inp) => (inp.disabled = true));

		const selectId = `${table.id}|select`;
		if (form && !$(`#${CSS.escape(selectId)}`, dataTableContainer)) {
			dataTableContainer.insertBefore(create('div', {
				id: selectId
			}), dataTableContainer.firstChild);
		}

		if (table.hasAttribute('context-menu') && !$(`#${CSS.escape(table.id)}\\|contextMenu`)) {
			const cm = create('div', {
				id: `${table.id}|contextMenu`,
				class: 'contextMenu'
			});
			table.parentNode.insertBefore(cm, table);
		}

		ajaxRequest(url, {
			method: 'GET',
			parameters: args,
			onCreate: () => {
				tableStatus?.querySelector('table td.dataTableRecords')?.replaceChildren(
					document.createTextNode('Loading table data…')
				);
			},
			onSuccess: (transport) => {
				const result = transport.responseJSON || {};
				if (result.caption) this.displayCaption(result.caption);
				table.tableData = result.data || [];
				this.clearSelection();
				this.displayData();
				this.displayPagination();
			},
			onFailure: (transport) => {
				const cell = tableStatus?.querySelector('table td.dataTableRecords');
				if (cell) {
					cell.textContent = `Failed to retrieve data. ${transport.status} ${transport.statusText}`;
					cell.classList.add('errorText');
				}
			},
		});
	},

	// NEW FUNCTION: clear selection via Escape hotkey
	clearHotkeyHook() {
		const table = this;
		table.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				if ($$('tbody .highlight', table).length > 0) {
					this.clearSelection();
					fire(table, ':postClearSelection');
				}
			}
		});
	},

	clearSelectionHook() {
		const table = this;
		const statusTable = table.closest('div.dataTableContainer')?.nextElementSibling?.matches('div.dataTableStatus') ?
			table.closest('div.dataTableContainer').nextElementSibling.querySelector('table') :
			null;

		if (!statusTable) return;

		delegate(statusTable, 'td.dataTableToggle', 'click', (_, td) => {
			if (td.getAttribute('data-action') === 'clear') {
				this.clearSelection();
				fire(table, ':postClearSelection');
			}
		});

		delegate(statusTable, 'td.dataTableToggle', 'keydown', (event, td) => {
			if (event.key === ' ' || event.key === 'Enter') {
				event.preventDefault();
				td.click();
			}
		});
	},

	clearSelection() {
		const table = this;
		$$('tbody .selectable', table).forEach((tr) => tr.classList.remove('highlight'));
		table.setAttribute('data-select', '');
		const selectNode = $(`#${CSS.escape(table.id)}\\|select`);
		if (selectNode) selectNode.innerHTML = '';
		this.toggleTableControls();
	},

	displayCaption(data) {
		const table = this;
		let caption = $('caption', table);
		if (!caption) {
			caption = create('caption');
			table.insertBefore(caption, table.firstChild);
		}
		caption.innerHTML = data;
	},

	displayData(start = 0, dataAttributes = false) {
		const table = this;
		const tbody = $('tbody.dataTableContent', table);
		if (!tbody) return;

		const viewAll = true;
		const end = viewAll ? table.tableData.length : (parseInt(start, 10) + dataTableOffset);
		tbody.innerHTML = '';

		const dataSelect = getJSONAttr(table, 'data-select');

		table.tableData.slice(start, end).forEach((trObj) => {
			const tr = document.createElement('tr');

			if (dataAttributes) {
				// {"tr-attr": {...}, "tr-data":[ {"td-attr": {...}, "td-data": "..."} , ... ]}
				const trAttr = trObj['tr-attr'] || {};
				Object.entries(trAttr).forEach(([k, v]) => tr.setAttribute(k, v));
				(trObj['tr-data'] || []).forEach((td) => {
					if (td['td-data'] !== undefined) {
						const tdEl = document.createElement('td');
						Object.entries(td['td-attr'] || {}).forEach(([k, v]) => tdEl.setAttribute(k, v));
						tdEl.innerHTML = td['td-data'];
						tr.appendChild(tdEl);
					}
				});
				tbody.appendChild(tr);
			} else {
				if (!table.hasAttribute('selectable')) {
					tr.classList.add('selectable');
					tr.setAttribute('tabindex', '0');
					tr.setAttribute('role', 'button');
				}

				const entries = Object.entries(trObj);
				let wroteDataArgs = false;

				entries.forEach(([key, value], idx) => {
					let writeData = true;

					if (idx === 0) {
						// first pair used to build data-args for selection
						const o = {
							[key]: value
						};
						setJSONAttr(tr, 'data-args', o);
						if (dataSelect) {
							Object.keys(dataSelect).forEach((k) => {
								if (Array.isArray(dataSelect[k])) {
									if (dataSelect[k].includes(value)) tr.classList.add('highlight');
								} else if (value === dataSelect[k]) tr.classList.add('highlight');
							});
						}
						writeData = false;
						wroteDataArgs = true;
					}

					if (table.hasAttribute('selectable')) writeData = true;

					if (writeData) {
						let cellContent = value;
						const urlRx = /^(https?:\/\/)/i;
						if (urlRx.test(String(value))) {
							const a = create('a', {
								href: value,
								target: '_blank'
							}, String(value));
							cellContent = a.outerHTML;
						} else {
							cellContent = String(value);
						}
						const td = document.createElement('td');
						td.innerHTML = cellContent;
						tr.appendChild(td);
					}
				});

				// Insert row
				tbody.appendChild(tr);
			}
		});

		fire(table, ':dataLoaded');
	},

	displayPagination(currentPage = 1) {
		const table = this;
		const dataTableContainer = table.closest('div.dataTableContainer');
		const status = dataTableContainer?.nextElementSibling?.matches('div.dataTableStatus') ?
			dataTableContainer.nextElementSibling :
			null;
		if (!status) return;

		const viewAll = true;
		if (viewAll) dataTableOffset = table.tableData.length;

		const totalPages = table.tableData.length > 0 ? Math.ceil(table.tableData.length / dataTableOffset) : 1;
		const displayStart = table.tableData.length > 0 ? (((currentPage - 1) * dataTableOffset) + 1) : 0;
		const displayEnd = (currentPage === totalPages) ? table.tableData.length : (((currentPage - 1) * dataTableOffset) + dataTableOffset);
		const recordsText = `Displaying ${displayStart} to ${displayEnd} of ${table.tableData.length} records`;

		const recordsCell = status.querySelector('table td.dataTableRecords');
		const pagCell = status.querySelector('table td.dataTablePagination');
		if (recordsCell) recordsCell.textContent = recordsText;
		if (!pagCell) return;

		pagCell.innerHTML = '';

		if (totalPages > 1) {
			const paging = create('div', {
				class: 'dataTablePages'
			});

			if (currentPage > 1) {
				const prevPage = create('button', {
					class: 'dataTablePage prev',
					'data-page': String(currentPage - 1),
					'data-offset': String((currentPage - 2) * dataTableOffset),
					'aria-label': 'Previous page',
				}, '&lsaquo; Prev');
				paging.appendChild(prevPage);
			}

			paging.appendChild(document.createTextNode(`${currentPage}/${totalPages}`));

			if (currentPage < totalPages) {
				const nextPage = create('button', {
					class: 'dataTablePage next',
					'data-page': String(currentPage + 1),
					'data-offset': String(displayEnd),
					'aria-label': 'Next page',
				}, 'Next &rsaquo;');
				paging.appendChild(nextPage);
			}

			pagCell.appendChild(paging);
			this.pagingHook();
		}
	},

	ajaxHook() {
		const table = this;
		const controls = table.closest('div.dataTableContainer')?.nextElementSibling?.matches('div.dataTableControls') ?
			table.closest('div.dataTableContainer').nextElementSibling :
			null;
		if (!controls) return;

		delegate(controls, 'input.ajax', 'click', (_, ajaxBtn) => {
			const msg = ajaxBtn.getAttribute('data-confirm') || 'Proceed?';
			const args = getJSONAttr(table, 'data-args') || {};
			const dataArgs = getJSONAttr(table, 'data-select') || {};
			Object.assign(args, dataArgs, {
				action: ajaxBtn.getAttribute('data-action')
			});
			const url = ajaxBtn.getAttribute('data-url');

			if (window.confirm(msg)) {
				ajaxRequest(url, {
					method: 'GET',
					parameters: args,
					onSuccess: (transport) => {
						const result = transport.responseJSON || {};
						table.refreshData();
						Messagebox(result);
					},
					onFailure: () => {
						Messagebox({
							error: 'An error occured with the request.'
						});
					},
				});
			}
			fire(table, ':postAjax');
		});
	},

	contextMenuHook(event, dataStr) {
		const table = this;
		const cm = $(`#${CSS.escape(table.id)}\\|contextMenu`);
		const url = table.getAttribute('context-menu');
		if (!cm || !url) return;

		let args;
		try {
			args = JSON.parse(dataStr);
		} catch {
			args = {};
		}

		const coords = pointer(event);
		const styles = {
			position: 'absolute',
			top: `${coords.y}px`,
			left: `${coords.x}px`,
			display: '',
		};

		ajaxRequest(url, {
			method: 'GET',
			parameters: args,
			onSuccess: (transport) => {
				cm.innerHTML = transport.responseText;
				Object.assign(cm.style, styles);
				show(cm);
				setupComponents(cm);
			},
		});
	},

	pagingHook() {
		const table = this;
		const status = table.closest('div.dataTableContainer')?.nextElementSibling?.matches('div.dataTableStatus') ?
			table.closest('div.dataTableContainer').nextElementSibling :
			null;
		if (!status) return;

		delegate(status, 'button.dataTablePage', 'click', (_, btn) => {
			const controls = table.closest('div.dataTableContainer')?.nextElementSibling?.matches('div.dataTableControls') ?
				table.closest('div.dataTableContainer').nextElementSibling :
				null;
			if (controls) $$('input.select-enabled', controls).forEach((inp) => (inp.disabled = true));
			this.clearSelection();
			this.displayData(parseInt(btn.getAttribute('data-offset') || '0', 10));
			this.displayPagination(parseInt(btn.getAttribute('data-page') || '1', 10));
		});
	},

	searchHook() {
		const table = this;
		const controls = table.closest('div.dataTableContainer')?.nextElementSibling?.matches('div.dataTableControls') ?
			table.closest('div.dataTableContainer').nextElementSibling :
			null;
		if (!controls) return;
		const input = $('input.search', controls) || $("input[type='search']", controls);
		if (!input) return;

		input.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				if (/^\s*$/.test(input.value)) this.refreshData();
				else this.refreshData({
					search: input.value
				});

				$$('th i', table).forEach((fa) => {
					const span = fa.closest('span') || fa.parentElement;
					if (span) span.innerHTML = '<i class="fa fa-sort" aria-hidden="true"></i>';
				});
			}
		});

		fire(table, ':postSearch');
	},

	selectHook() {
		const table = this;
		const form = table.closest('form');

		// Single click on selectable rows
		delegate(table, 'tbody .selectable', 'click', (event, tr) => {
			if (table.hasAttribute('select-multiple')) {
				if (event.shiftKey) {
					if (window.getSelection) window.getSelection().removeAllRanges();
					// find previous highlighted
					let p = tr.previousElementSibling;
					let prevHighlightedRowIndex = null;
					while (p) {
						if (p.classList.contains('highlight')) {
							prevHighlightedRowIndex = p.rowIndex;
							break;
						}
						p = p.previousElementSibling;
					}
					const startIdx = prevHighlightedRowIndex !== null ? prevHighlightedRowIndex + 1 : tr.rowIndex;
					const endIdx = tr.rowIndex;
					const rows = table.rows;
					const [min, max] = [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)];
					for (let i = min; i <= max; i++) {
						rows[i].classList.toggle('highlight');
					}
				} else {
					tr.classList.toggle('highlight');
				}
			} else {
				this.clearSelection();
				tr.classList.toggle('highlight');
			}

			// Table row input
			let trArgs = getJSONAttr(tr, 'data-args') || {};

			// Multi-select aggregates
			if (table.hasAttribute('select-multiple')) {
				const trArgsArray = [];
				const trArgsKey = Object.keys(trArgs)[0];
				$$('tbody.dataTableContent tr.highlight', table).forEach((row) => {
					const o = getJSONAttr(row, 'data-args') || {};
					trArgsArray.push(Object.values(o)[0]);
				});
				trArgs = {
					[trArgsKey]: trArgsArray
				};
			}

			setJSONAttr(table, 'data-select', trArgs);

			// Hidden selection inputs
			const selectNode = $(`#${CSS.escape(table.id)}\\|select`);
			if (selectNode) {
				selectNode.innerHTML = '';
				Object.entries(trArgs).forEach(([k, v]) => {
					if (table.hasAttribute('select-multiple') && Array.isArray(v)) {
						v.forEach((item) => {
							selectNode.appendChild(create('input', {
								type: 'hidden',
								name: `${k}[]`,
								value: item
							}));
						});
					} else {
						selectNode.appendChild(create('input', {
							type: 'hidden',
							name: k,
							value: v
						}));
					}
				});
			}

			this.toggleTableControls();
			fire(table, ':postSelect');
		});

		// Double click = submit if a form is present
		delegate(table, 'tbody .selectable', 'dblclick', (_, tr) => {
			if (tr.classList.contains('selectable') && form) form.submit();
		});

		// Keyboard activation
		delegate(table, 'tbody .selectable', 'keydown', (event, tr) => {
			if (event.key === ' ' || event.key === 'Enter') {
				if (event.key === ' ' || (event.key === 'Enter' && !form)) {
					event.preventDefault();
					tr.click();
					tr.focus();
				}
				if (event.key === 'Enter' && tr.classList.contains('selectable') && form) {
					event.preventDefault();
					tr.click();
					form.submit();
				}
			} else if (event.shiftKey && event.key === 'F10') {
				event.preventDefault();
				tr.dispatchEvent(new Event('contextmenu', {
					bubbles: true
				}));
			}
		});

		// Context menu
		table.addEventListener('contextmenu', (event) => {
			const tr = event.target.closest('tbody .selectable');
			if (!tr) return;
			if (table.hasAttribute('context-menu') && tr.classList.contains('selectable')) {
				event.preventDefault();
				tr.focus();

				if (table.hasAttribute('select-multiple')) tr.classList.toggle('highlight');
				else {
					this.clearSelection();
					tr.classList.toggle('highlight');
				}

				let trArgs = getJSONAttr(tr, 'data-args') || {};
				if (table.hasAttribute('select-multiple')) {
					const trArgsArray = [];
					const trArgsKey = Object.keys(trArgs)[0];
					$$('tbody.dataTableContent tr.highlight', table).forEach((row) => {
						const o = getJSONAttr(row, 'data-args') || {};
						trArgsArray.push(Object.values(o)[0]);
					});
					trArgs = {
						[trArgsKey]: trArgsArray
					};
				}

				setJSONAttr(table, 'data-select', trArgs);

				const selectNode = $(`#${CSS.escape(table.id)}\\|select`);
				if (selectNode) {
					selectNode.innerHTML = '';
					Object.entries(trArgs).forEach(([k, v]) => {
						selectNode.appendChild(
							create('input', {
								type: 'hidden',
								name: `${k}${table.hasAttribute('select-multiple') ? '[]' : ''}`,
								value: v,
							})
						);
					});
				}

				this.contextMenuHook(event, tr.getAttribute('data-args') || '{}');
				this.toggleTableControls();
			}
		});
	},

	sortHook() {
		const table = this;

		delegate(table, 'th', 'click', (_, th) => {
			// Reset others
			$$('th', table).forEach((header) => {
				if (header !== th) {
					header.setAttribute('aria-sort', 'none');
					$$('i', header).forEach((fa) => {
						const btn = fa.closest('button') || fa.parentElement;
						if (btn) btn.innerHTML = '<i class="fa fa-sort" aria-hidden="true"></i>';
					});
				}
			});

			const currentOrder = th.getAttribute('data-order') || 'asc';
			const sortType = /desc/.test(currentOrder) ? 'asc' : 'desc';
			const sortDesc = /desc/.test(sortType);
			const sortArgs = {
				prop: th.getAttribute('data-sort'),
				desc: sortDesc,
			};
			if (/numeric/i.test(th.getAttribute('data-type') || '')) {
				sortArgs.parser = (d) => Number(d);
			}

			th.setAttribute('data-order', sortType);
			const btn = $('button', th) || th;
			btn.innerHTML = `<i class="fa fa-sort-${sortType}" aria-hidden="true"></i>`;
			th.setAttribute('aria-sort', `${sortType}ending`);

			table.tableData.sortElementsBy(sortArgs);
			this.displayData();
		});
	},

	toggleHighlightHook() {
		const table = this;
		const status =
			table.closest('div.dataTableContainer')?.nextElementSibling?.matches('div.dataTableStatus') ?
			table.closest('div.dataTableContainer').nextElementSibling :
			null;

		if (!status) return;

		// Unified delegate for both click and key activation
		delegate(status, 'td.dataTableToggle button', 'click', (_, btn) => {
			const td = btn.closest('td.dataTableToggle');
			const icon = td.querySelector('button i');
			const action = td.getAttribute('data-action');

			if (action === 'highlight only') {
				td.setAttribute('data-action', 'show all');
				icon.classList.remove('fa-bookmark');
				icon.classList.add('fa-bookmark-o');

				$$('tbody.dataTableContent tr', table).forEach(row => {
					if (!row.classList.contains('highlight')) row.classList.add('hide');
				});
			} else {
				td.setAttribute('data-action', 'highlight only');
				icon.classList.remove('fa-bookmark-o');
				icon.classList.add('fa-bookmark');

				$$('tbody.dataTableContent tr', table).forEach(row => {
					row.classList.remove('hide');
				});
			}

			// keep focus stable for keyboard users
			btn.focus();
		});

		delegate(status, 'td.dataTableToggle button', 'keydown', (event, btn) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();

				// simulate a click so all toggle logic stays in ONE place
				btn.click();
			}
		});
	},

	toggleTableControls() {
		const table = this;
		const dataTableContainer = table.closest('div.dataTableContainer');

		const controls = dataTableContainer
			?.parentElement
			?.querySelector(':scope > div.dataTableControls');

		const modalControls =
			table.closest('#modalWindow')?.querySelector('controls') || null;

		const anySelected = $$('tbody .highlight', table).length > 0;

		const setDisable = (container, disabled) => {
			if (!container) return;

			$$('input.select-enabled', container).forEach(inp => {
				if (disabled) {
					inp.setAttribute('disabled', '');
				} else {
					inp.removeAttribute('disabled');
				}
			});
		};

		setDisable(controls, !anySelected);
		setDisable(modalControls, !anySelected);
	},


	resizeHook() {
		const table = this;
		const status = table.closest('div.dataTableContainer')?.nextElementSibling?.matches('div.dataTableStatus') ?
			table.closest('div.dataTableContainer').nextElementSibling :
			null;
		const container = table.closest('div.dataTableContainer');
		if (!status || !container) return;

		status.addEventListener('mousedown', (evt) => {
			evt.preventDefault();

			const onMove = (e) => {
				const resizeHeight = e.pageY - positionedOffset(container).top;
				if (resizeHeight > 55) {
					Object.assign(container.style, {
						maxHeight: `${resizeHeight}px`,
						height: `${resizeHeight}px`,
					});
				}
			};

			const onUp = () => {
				document.removeEventListener('mousemove', onMove);
				document.removeEventListener('mouseup', onUp);
			};

			document.addEventListener('mousemove', onMove);
			document.addEventListener('mouseup', onUp);
		});
	},
};

/* ===========================
TabsExt 
=========================== */

const TabsExt = {
	refreshArgs: {},

	loadTab(urlIn) {
		const tab = this;
		const url = (/\/ajax\/[^/]*\/?/).test(urlIn || '') ? urlIn : tab.getAttribute('data-url');
		const args = getJSONAttr(tab, 'data-args') || {};
		const tabContainer = tab.closest('div.tabs');
		const tabContent = tabContainer?.nextElementSibling?.matches('div.tabContent') ?
			tabContainer.nextElementSibling :
			null;
		if (!tabContainer || !tabContent) return;

		// Unselect all
		$$('span.tab, div.vtab', tabContainer).forEach((t) => {
			t.classList.remove('selected');
			t.setAttribute('aria-selected', 'false');
			t.setAttribute('tabindex', '-1');
		});

		// Select current
		tab.classList.add('selected');
		tab.setAttribute('aria-selected', 'true');
		tab.setAttribute('tabindex', '0');
		tab.focus();

		// Tab panel ARIA
		tabContent.setAttribute('role', 'tabpanel');
		tabContent.setAttribute('aria-labelledby', tab.id || tab.getAttribute('aria-controls'));
		tabContent.setAttribute('id', tab.getAttribute('aria-controls'));

		// vtabs min-height
		if (tab.classList.contains('vtab')) {
			tabContent.style.minHeight = `${tab.closest('div.tabs').getBoundingClientRect().height}px`;
		}

		ajaxRequest(url, {
			method: 'GET',
			parameters: args,
			onCreate: () => {
				tabContent.innerHTML = '<div class="loadingText"><i class="fa fa-cog fa-spin" aria-hidden="true"></i>Loading page content…</div>';
			},
			onSuccess: (transport) => {
				tabContent.innerHTML = transport.responseText;
				setupComponents(tabContent);
			},
			onFailure: (transport) => {
				tabContent.innerHTML = `<div class="error box"><i class="fa fa-times-circle" aria-hidden="true"></i>${transport.status} ${transport.statusText}&nbsp;-&nbsp;${transport.responseText}</div>`;
			},
		});
	},

	// Arrow-key navigation between tabs
	setupKeyNavigation(tabContainer) {
		delegate(tabContainer, 'span.tab, div.vtab', 'keydown', (event, currentTab) => {
			const isVTab = currentTab.classList.contains('vtab');
			const tabs = $$('span.tab, div.vtab', tabContainer);
			const currentTabIndex = tabs.indexOf(currentTab);

			const KEY_LEFT = 37,
				KEY_UP = 38,
				KEY_RIGHT = 39,
				KEY_DOWN = 40;
			const KEY_ENTER = 13,
				KEY_SPACE = 32;
			const keyCode = event.keyCode;

			// Arrow navigation
			if ((!isVTab && (keyCode === KEY_LEFT || keyCode === KEY_RIGHT)) ||
				(isVTab && (keyCode === KEY_UP || keyCode === KEY_DOWN))) {

				event.preventDefault();
				let newIndex;
				if (keyCode === KEY_LEFT || keyCode === KEY_UP) {
					newIndex = (currentTabIndex === 0) ? tabs.length - 1 : currentTabIndex - 1;
				} else {
					newIndex = (currentTabIndex === tabs.length - 1) ? 0 : currentTabIndex + 1;
				}

				const targetTab = tabs[newIndex];
				if (targetTab) {
					currentTab.setAttribute('tabindex', '-1');
					targetTab.setAttribute('tabindex', '0');
					targetTab.focus();
				}
			} else if (keyCode === KEY_ENTER || keyCode === KEY_SPACE) {
				event.preventDefault();
				currentTab.click();
			}
		});
	},
};
