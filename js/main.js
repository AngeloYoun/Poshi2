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
			var commandLogScope;
			var fails;

			var sidebar = A.one('.sidebar');
			var xmlLog = A.one('.xml-log');

			var collapsePairIndex = 0;
			var passFailHeight = 0;
			var inCommandLogMode = false;

			var WIN = A.getWin();

			function init() {
				sidebar.delegate(
					'click',
					linkFunction,
					'.linkable .line-container'
				);

				sidebar.delegate(
					'click',
					collapseToggle,
					'.expand-toggle',
					null,
					null,
					true
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

				xmlLog.delegate(
					'click',
					showError,
					'.error-btn'
				);

				xmlLog.delegate(
					'click',
					showError,
					'.screenshot-btn'
				);

				xmlLog.delegate(
					'click',
					fullScreen,
					'.screenshot-container img, .fullscreen-image'
				)

				var logBtn = sidebar.one('.btn-command-log');

				logBtn.on(
					'click',
					commandLogToggle
				);

				var sidebarBtn = sidebar.one('.btn-sidebar');

				sidebarBtn.on(
					'click',
					resizeXmlLog
				);

				var jumpToBtn = sidebar.one('.btn-jump-to-error');

				jumpToBtn.on(
					'click',
					expandTree
				);

				commandLogToggle();
			}

			init();
			function xmlLogRefresh(node) {
				expandTree(null, node);
				scopeSelect(null, node);
			}

			function expandTree(event, node, noScroll) {
				if (!node) {
					node = fails.last();
				}
				var tree = node.ancestors('.child-container');

				var temp = expandLoop(tree, node, noScroll);
			}

			function expandLoop(tree, target, noScroll) {
				var timing = 0;

				var node = tree.splice(0, 1);

				node = node.item(0);

				if (node.hasClass('collapse')) {
					collapseToggle(null, node);
					timing = 200;
				}
				if(tree.size() > 0) {
					setTimeout(expandLoop, timing, tree, target, noScroll);
				}
				else if(!noScroll) {
					scrollToNode(target);
				}
			}

			function transitionCommandLog(commandLog) {
				var newHeight = 0;
				var newWidth = '20%';

				if (inCommandLogMode) {
					newWidth = '40%';
				}

				sidebar.setStyle('width', newWidth);
				resizeXmlLog();
				commandLog.toggleClass('collapse');

				var lastLog = commandLog.one('ul:last-child');

				var lastLine = lastLog.previous();

				var functionId = lastLine.attr('data-functionLinkId');

				if (lastLog.hasClass('collapse')) {
					collapseToggle(null, lastLog, true);
				}

				if (commandLogScope) {
					scrollToNode(commandLogScope.item(0), true)
				}
			}

			function commandLogToggle(event) {
				var commandLog;

				if (event) {
					var currentTarget = event.currentTarget;
					currentTarget.toggleClass('toggle');
					commandLog = getLink(currentTarget, '.command-log', 'data-logId', sidebar);
				}
				else {
					commandLog = A.one('.command-log');
				}

				inCommandLogMode = !inCommandLogMode;

				var logId = commandLog.attr('data-logId');

				var status = ['pass', 'pending', 'fail']
				var selector = 'data-status' + logId;

				for (var i = 0; i < status.length; i++) {
					var nodes = A.all('[' + selector + '="' + status[i] + '"]')
					nodes.toggleClass(status[i]);
				}

				transitionCommandLog(commandLog);

				fails = xmlLog.all('.fail');

				if (fails) {
					fails.each(xmlLogRefresh);
				}

				var body = A.one('body');

				body.toggleClass('tree');
			}

			function resizeXmlLog(event) {
				var defaultReset = true;
				if (event) {
					var currentTarget = event.currentTarget;
					defaultReset = false;
				}

				var xmlLogWidth = 100;
				var translation = 100;

				if (defaultReset || currentTarget.hasClass('toggle')) {
					var sidebarWidth = sidebar.getStyle('width');

					if (sidebarWidth.indexOf('%') === -1) {
						sidebarWidth = 100 * (parseFloat(sidebarWidth) / WIN.width());
					}
					else {
						sidebarWidth = parseFloat(sidebarWidth);
					}
					xmlLogWidth = (100 - sidebarWidth);

					translation = 0;
				}
				sidebar.setStyle('transform', 'translateX(' + translation + '%)');
				xmlLog.setStyle('width', xmlLogWidth + '%');

				if (!defaultReset) {
					currentTarget.toggleClass('toggle');
				}
			}

			function manageHeightDiff(heightDiff, node) {
				var nodeList = node.ancestors('[data-prevHeight]');

				if (nodeList.size() > 0) {
					for (var i = 0; i < nodeList.size(); i++) {
						var ancestorNode = nodeList.item(i);

						var prevHeight = ancestorNode.attr('data-prevHeight');

						ancestorNode.attr('data-prevHeight', (parseInt(prevHeight, 10) + heightDiff));
					}
				}
			}

			function linkFunction(event) {
				var currentTarget = event.currentTarget.ancestor();

				var linkedFunction = getLink(currentTarget, 'li', 'data-functionLinkId', xmlLog);

				if (currentScope) {
					currentScope.removeClass('current-scope');
				}

				parseCommandLog(currentTarget, true)

				linkedFunction.addClass('current-scope');

				currentScope = linkedFunction;

				expandTree(null, linkedFunction);
			}

			function collapseToggle(event, collapseContainer, inSidebar) {
				var collapseBtn;
				var scope = xmlLog;
				var resetHeights = true;

				if(inSidebar) {
					resetHeights = false;
					scope = sidebar;
				}

				if (!collapseContainer) {
					collapseBtn = event.currentTarget;

					collapseContainer = getLink(collapseBtn, '.collapsible', 'data-btnLinkId', scope);
				}
				else {
					collapseBtn = getLink(collapseContainer, '.btn', 'data-btnLinkId', scope);
				}

				var collapsed = collapseTransition(collapseContainer, resetHeights);

				if (collapsed) {
					collapseBtn.toggleClass('toggle');
				}
			}

			var running;

			function collapseTransition(targetNode, resetHeights) {
				var height;

				if (targetNode && (!running || !running.contains(targetNode))) {
					var collapsing = targetNode.getStyle('height') != '0px';
					if (collapsing) {
						height = targetNode.outerHeight();

						targetNode.setStyle('height', height);

						running = targetNode;
					}
					else {
						var lastChild = targetNode.getDOMNode().lastElementChild;

						lastChild = A.Node(lastChild);

						targetNode.removeClass('collapse');
						targetNode.addClass('transitioning');

						var lastChildY = lastChild.getY();
						var lastChildHeight = lastChild.innerHeight();
						var lastChildBottomY = lastChildY + lastChildHeight + 1;

						height = (lastChildBottomY - targetNode.getY());
					}
					getTransition(targetNode, height, collapsing, resetHeights);

					return true;
				}
			}

			function fullScreen(event) {
				var node = event.currentTarget;

				var src = node.attr('src');
				var fullscreenDiv = A.one('.fullscreen-image');
				if (fullscreenDiv.hasClass('toggle')) {
					fullscreenDiv.append(A.Node.create('<img alt="fullscreen screenshot" src="' + src + '">'));
				}
				else {
					fullscreenDiv.one('*').remove(true);
				}
				fullscreenDiv.toggleClass('toggle');
			}

			function getTransition(targetNode, height, collapsing, resetHeights) {
				var transDuration = (Math.pow(height, 0.35) / 15);

				var ease = 'ease-in';
				var newHeight = height;

				if (collapsing) {
					newHeight = 0;

					ease = 'ease-out';
				}

				var reset;

				targetNode.addClass('transitioning');

				targetNode.transition(
					{
						height: {
							duration: transDuration,
							easing: ease,
							value: newHeight
						},
						on: reset
					},
					function() {
						callback(this, collapsing);
						running = null;
						targetNode.removeClass('transitioning');
					}
				);
			}

			function callback(node, collapsing, inSidebar) {
				var height = 'auto';
				if (inSidebar) {
					height = '100%';
				}
				if (collapsing) {
					node.addClass('collapse');
				}
				else {
					node.setStyle('height', height);
				}
			}

			function getLink(node, selector, attrName, scope, returnAll) {
				var linkId = node.attr(attrName);

				if (!scope) {
					scope = A;
				}
				var attrSelector = (selector + '[' + attrName + '=' + linkId + ']');
				var links;
				if (!returnAll) {
					links = scope.one(attrSelector);
				}
				else {
					links = scope.all(attrSelector);
				}
				return links;
			}

			function scopeHover(event, enter) {
				var currentTarget = event.currentTarget;
				var target = event.target;

				if (testClickable(target)) {
					currentTarget.toggleClass('scoped', enter);

					var node = currentTarget.ancestor('.macro, .test-group');

					if (enter) {
						node = currentTarget.ancestors('.macro, .test-group');
					}

					if (node) {
						node.toggleClass('scoped', !enter);
					}

					event.stopPropagation();
				}
			}

			function scopeSelect(event, node) {
				var scope
				var clickable = true;

				if (!event) {
					scope = node;
				}
				else {
					var scope = event.currentTarget;
					clickable = testClickable(event.target);
					event.stopPropagation();
				}

				if (clickable) {

					if (currentScope) {
						currentScope.removeClass('current-scope');
					}

					currentScope = scope;
					scopeSidebar();
					scope.addClass('current-scope');
					parseCommandLog(scope);
				}
			}

			function parseCommandLog(scope, noLookUp) {
				if (commandLogScope) {
					commandLogScope.removeClass('current-scope');
				}
				commandLogScope = new A.NodeList();

				if (scope.hasClass('macro')) {
					var macroScope = scope.all('[data-functionLinkId]');

					macroScope.each(
						scopeCommandLog
					);
				}
				else {
					scopeCommandLog(scope, null, null, noLookUp);
				}

				scrollToNode(commandLogScope.item(0), true);
			}

			function scopeCommandLog(scope, index, nodeList, noLookUp) {
				var scrollTo = scope;

				if (!noLookUp) {
					scope = getLink(scope, '.linkable', 'data-functionLinkId', sidebar, true);

					scrollTo = scope.item(0);

					while(scope.size() > 0) {
						var node = scope.pop()
						commandLogScope.push(node);
					}
				}
				else {
					commandLogScope.push(scope);
				}

				commandLogScope.addClass('current-scope');
			}

			function scopeSidebar() {
				if (currentScope) {
					var sidebarScopeName = sidebar.one('.scope-type .scope-name');
					var sidebarScopeTitle = sidebar.one('.scope-type .title');
					var sidebarParameterTitle = sidebar.one('.parameter .title');
					var sidebarParameterList = sidebar.one('.parameter .parameter-list');

					var scopeNames = currentScope.all('> .line-container .name');
					var scopeTypes = currentScope.all('> .line-container .tag-type');

					var scopeType = scopeTypes.item(0);
					var scopeName = scopeNames.item(0);
					if (scopeName) {
						scopeName = scopeName.html();
					}
					else {
						var scopeName = currentScope.one('.testCaseCommand');

						if (scopeName) {
							scopeName = scopeName.html();
						}
					}
					if (scopeType && scopeType.html() != 'name') {
						scopeType = scopeType.html();
					}
					else {
						scopeType = currentScope.one('> .line-container .action-type');

						if (scopeType) {
							scopeType = scopeType.html();
						}
						else {
							scopeType = 'test-case'
						}

					}

					sidebarScopeName.html(scopeName);
					sidebarScopeTitle.html(scopeType);

					sidebarParameterList.all('> *').remove(true);

					var parameterCount;

					sidebarParameterTitle.removeClass('hidden');

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
					else {
						sidebarParameterTitle.addClass('hidden');
					}
				}
			}

			function scrollToNode(node, inSidebar) {
				var scrollNode = WIN;
				if (inSidebar) {
					scrollNode = sidebar.one('.command-log');
				}

				if (node) {
					var winHalf = (WIN.height() / 2);

					var halfNodeHeight = (node.innerHeight() / 2);

					var offset = (winHalf - halfNodeHeight);

					var nodeY = node.getY();
					if (inSidebar) {
						nodeY = (nodeY - sidebar.one('.divider-line').getY());
					}

					var yDistance = (nodeY - offset);

					var scroll = new A.Anim(
						{
							duration: 2,
							easing: 'easeOutStrong',
							node: scrollNode,
							to: {
								scroll: [0, yDistance]
							}
						}
					);

					scroll.run();
				}
			}

			function showError(event) {
				var currentTarget = event.currentTarget;

				currentTarget.toggleClass('toggle');

				var errorPanel = getLink(currentTarget, '.errorPanel', 'data-errorLinkId', xmlLog);

				if (errorPanel) {
					errorPanel.toggleClass('toggle');
				}
			}

			function testClickable(testNode) {
				return !testNode.test('.btn, .btn-container, polygon, svg');
			}

			function testScopeable(testNode) {
				return testNode.hasClass('macro') || testNode.hasClass('function') || testNode.hasClass('test-group');
			}
		}
	);
