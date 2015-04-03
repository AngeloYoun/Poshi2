YUI()
	.ready(
		'anim',
		'aui-button',
		'aui-node',
		'event',
		'resize',
		'transition',
		function(A) {
			var currentScope;

			var divider = A.one('.pass-fail-divider');
			var lastFail = A.one('.last-fail');
			var sidebar = A.one('.sidebar');
			var xmlLog = A.one('.xml-log');

			var failDivs = xmlLog.all('.fail-divider');

			var collapsePairIndex = 0;
			var passFailHeight = 0;

			var WIN = A.getWin();

			var treeToFail = lastFail.ancestors('ul');

			function init() {

				expandTree(lastFail);

				sidebar.delegate(
					'click',
					linkFunction,
					'.linkable'
				);

				xmlLog.delegate(
					'click',
					collapseToggle,
					'.btn-collapse'
				);

				xmlLog.delegate(
					'click',
					collapseToggle,
					'.btn-var'
				);

				xmlLog.delegate(
					'mouseenter',
					scopeHover,
					testScopeable,
					null,
					true
				);

				xmlLog.delegate(
					'mouseleave',
					scopeHover,
					testScopeable,
					null,
					false
				);

				xmlLog.delegate(
					'click',
					scopeSelect,
					testScopeable
				);

				var treeBtn = sidebar.one('.btn-tree');

				treeBtn.on(
					'click',
					commandTree
				);

				var sidebarBtn = sidebar.one('.btn-sidebar');

				sidebarBtn.on(
					'click',
					animateSidebar
				);

				var errorBtns = xmlLog.all('.error-btn');

				errorBtns.on(
					'click',
					showError
				);

				var screenshotBtns = A.all('.screen-shot-btn');

				screenshotBtns.on(
					'click',
					showError
				);

				scrollToNode(lastFail);
			}

			init();

			function expandTree(node) {
				var tree = node.ancestors('.child-container');

				tree.each(
					function(target) {
						if (target.hasClass('collapsed')) {
							collapseToggle(null, target);
						}
					}
				);
			}

			function commandTree(event) {
				var currentTarget = event.currentTarget;

				var commandLog = sidebar.one('.command-log');

				currentTarget.toggleClass('toggle');

				if (currentTarget.hasClass('toggle')) {
					sidebar.setStyle('width', '40%');
					xmlLog.setStyle('width', '60%');

					commandLog.toggleClass('hidden');

					commandLog.transition(
						{
							height: {
								duration: 0.5,
								easing: 'ease-out',
								value: WIN.height()
							}
						},
						function() {
							commandLog.setStyle('height', '100%');
						}
					);
				}
				else {
					sidebar.setStyle('width', '20%');
					xmlLog.setStyle('width', '80%');

					commandLog.setStyle('height', commandLog.innerHeight());

					commandLog.transition(
						{
							height: {
								duration: 0.5,
								easing: 'ease-out',
								value: 0
							}
						},
						function() {
							commandLog.toggleClass('hidden');
						}
					);
				}

				commandLog.toggleClass('toggle');

				var body = A.one('body');

				body.toggleClass('tree');
			}

			function animateSidebar(event) {
				var currentTarget = event.currentTarget;

				if (currentTarget.hasClass('toggle')) {
					sidebar.setStyle('transform', 'translateX(0%)');
					xmlLog.setStyle('width', '80%');
				}
				else {
					sidebar.setStyle('transform', 'translateX(100%)');
					xmlLog.setStyle('width', '100%');
				}

				currentTarget.toggleClass('toggle');
			}

			function recalculateHeights() {
				failDivs.each(
					function(node) {
						var lineContainer = node.next();

						var newHeight = lineContainer.outerHeight();

						node.setStyle('height', newHeight);
					}
				);
			}

			var newExpandHeight;

			var running = null;

			function resetDividerHeight(newHeight, node) {
				if ((passFailHeight === 0) || (node.getY() <= passFailHeight)) {
					var pending = false;

					var firstClosedLi = lastFail;
					var newDivider;

					for (var i = 1; i < treeToFail.size(); i++) {
						var target = treeToFail.item(i);

						if (node === target) {
							pending = true;
						}
						if (target.getStyle('display') == 'none') {
							firstClosedLi = target.previous();

							break;
						}
					}

					var lineContainer = node.previous();

					if (newHeight === 0) {
						if (pending) {
							var containerY = lineContainer.getY();
							var containerHeight = lineContainer.outerHeight();

							passFailHeight = (containerY + containerHeight);
						}
						else if (!running) {
							passFailHeight -= node.outerHeight();
						}
						newExpandHeight = passFailHeight;

						divider.setStyle('height', passFailHeight);
					}
					else {
						if (pending) {
							var firstClosedLiY = firstClosedLi.getY();
							var firstClosedLiHeight = firstClosedLi.outerHeight();

							newExpandHeight = (firstClosedLiY + firstClosedLiHeight);
						}
						else {
							newExpandHeight += newHeight;
						}
						divider.setStyle('height', newExpandHeight);
					}
					recalculateHeights();
				}
			}

			function linkFunction(event) {
				var currentTarget = event.currentTarget;

				var linkedFunction = getLink(currentTarget, 'li', 'data-functionLinkId', xmlLog);

				linkedFunction.toggleClass('linked');

				expandTree(linkedFunction);

				scrollToNode(linkedFunction);
			}

			function collapseToggle(event, collapseContainer) {
				var collapseBtn;

				if (!collapseContainer) {
					collapseBtn = event.currentTarget;
					collapseContainer = getLink(collapseBtn, '.collapsible', 'data-btnLinkId', xmlLog);
				}
				else {
					collapseBtn = getLink(collapseContainer, '.btn', 'data-btnLinkId', xmlLog);
				}

				collapseTransition(collapseContainer);
				collapseBtn.toggleClass('toggle');
			}

			function collapseTransition(targetNode) {
				var height;

				if (targetNode) {
					if (targetNode.getStyle('height') != '0px') {
						if (running === targetNode || !running) {
							height = targetNode.outerHeight();

							targetNode.setStyle('height', height);

							getTransition(targetNode, height, true);
						}
					}
					else {
						var lastChild = targetNode.getDOMNode().lastElementChild;

						lastChild = A.Node(lastChild);

						targetNode.removeClass('collapsed');

						var lastChildY = lastChild.getY();
						var lastChildHeight = lastChild.innerHeight();
						var lastChildBottomY = lastChildY + lastChildHeight + 1;

						height = (lastChildBottomY - targetNode.getY());

						running = targetNode;

						getTransition(targetNode, height, false);
					}
				}
			}

			function getTransition(targetNode, height, collapsing) {
				var callback = function(node) {
					node.setStyle('height', 'auto');
					passFailHeight = newExpandHeight;
				};

				var transDuration = (Math.pow(height, 0.35) / 15);

				var ease = 'ease-in';

				if (collapsing) {
					callback = function(node) {
						node.addClass('collapsed');
					};

					height = 0;

					ease = 'ease-out';
				}

				targetNode.transition(
					{
						height: {
							duration: transDuration,
							easing: ease,
							value: height
						},
						on: {
							start: resetDividerHeight(height, targetNode)
						}
					},
					function() {
						running = null;
						callback(this);
					}
				);
			}

			function getLink(node, selector, attrName, scope) {
				var linkId = node.attr(attrName);

				if (!scope) {
					scope = A;
				}
				return scope.one(selector + '[' + attrName + '=' + linkId + ']');
			}

			function scopeHover(event, enter) {
				var currentTarget = event.currentTarget;
				var target = event.target;

				if (testClickable(target)) {
					currentTarget.toggleClass('scoped', enter);

					var node = currentTarget.ancestor('.macro');

					if (enter) {
						node = currentTarget.ancestors('.macro');
					}

					if (node) {
						node.toggleClass('scoped', !enter);
					}

					event.stopPropagation();
				}
			}

			function scopeSelect(event) {
				var scope = event.currentTarget;
				var target = event.target;

				if (testClickable(target)) {

					if (currentScope) {
						currentScope.removeClass('current-scope');
					}

					currentScope = scope;
					scopeSidebar();
					scope.addClass('current-scope');
					event.stopPropagation();
				}
			}

			function scopeSidebar() {
				if (currentScope) {
					var sidebarScopeName = sidebar.one('.scope-type .scope-name');
					var sidebarScopeTitle = sidebar.one('.scope-type .title');
					var sidebarParameterList = sidebar.one('.parameter .parameter-list');

					var scopeNames = currentScope.all('> .line-container .name');
					var scopeTypes = currentScope.all('> .line-container .tag-type');

					var scopeName = scopeNames.item(0).html();
					var scopeType = scopeTypes.item(0).html();

					sidebarScopeName.html(scopeName);
					sidebarScopeTitle.html(scopeType);

					sidebarParameterList.all('> *').remove();

					var parameterCount;

					if (scopeType === 'macro') {
						var parameters = currentScope.all('> .line-container .parameter-container .parameter-value');

						parameterCount = parameters.size();

						for (var i = 0; i < parameterCount; i += 2) {
							sidebarParameterList.append(A.Node.create('<li class="parameter-name">' + parameters.item(i).html() + '</div>'));
							sidebarParameterList.append(A.Node.create('<li class="parameter-value">' + parameters.item(i + 1).html() + '</div>'));
						}
					}
					else if (scopeType === 'function') {
						parameterCount = (scopeNames.size() - 1);

						for (var i = 1; i <= parameterCount; i++) {
							sidebarParameterList.append(A.Node.create('<li class="parameter-name">' + scopeTypes.item(i).html() + '</div>'));
							sidebarParameterList.append(A.Node.create('<li class="parameter-value">' + scopeNames.item(i).html() + '</div>'));
						}
					}
				}
			}

			function scrollToNode(node) {
				var winHalf = (WIN.height() / 2);

				var halfNodeHeight = (node.innerHeight() / 2);

				var offset = (winHalf - halfNodeHeight);

				var yWindowOffset = WIN.getDOMNode().pageYOffset;

				var yDistance = (node.getY() - offset);

				var scroll = new A.Anim(
					{
						duration: 2,
						easing: 'easeOutStrong',
						node: WIN,
						to: {
							scroll: [0, yDistance]
						}
					}
				);

				scroll.run();
			}

			function showError(event) {
				var currentTarget = event.currentTarget;

				var errorPanel = getLink(currentTarget, '.errorPanel', 'data-errorLinkId', xmlLog);

				if (errorPanel) {
					errorPanel.toggleClass('hidden');
				}
			}

			function testClickable(testNode) {
				return !testNode.test('.btn, .btn-container, polygon, svg');
			}

			function testScopeable(testNode) {
				return testNode.hasClass('macro') || testNode.hasClass('function');
			}
		}
	);
