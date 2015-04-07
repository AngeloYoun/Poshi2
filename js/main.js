YUI()
	.ready(
		'anim',
		'aui-button',
		'aui-node',
		'event',
		'resize',
		'transition',
		function(A) {
			// generation();
			function generation() {
				var allNodes = A.all('*');
				// console.log(allNodes)
				var btnLinkId = 1095;
				allNodes.each(
					function(node) {
						if (node.hasClass('action-type') && node.html() == 'if') {
							var ifContainer = node.ancestor('li');
							if (ifContainer.hasClass('pass')) {
								var containedPass = ifContainer.one('.pass')
								if (!containedPass) {
									ifContainer.addClass('conditional-failed')
								}
								else {
									var containedPassType = containedPass.one('.action-type');
									var containedPassHtml = containedPass.one('.action-type').html();
									if (containedPassHtml == 'else' || containedPassHtml == 'elseif') {
										ifContainer.addClass('conditional-elsed');
									}
									else {
										console.log(containedPassType.html())
										ifContainer.addClass('conditional-passed');
									}
								}
							}
						}
						if (node.hasClass('action-type') && node.html() == 'while') {
							var whileContainer = node.ancestor('li');
							if (whileContainer.hasClass('pass')) {
								var containedPass = whileContainer.one('.pass')
								if (!containedPass) {
									whileContainer.addClass('conditional-failed')
								}
							}
						}
						if (node.hasClass('expand-toggle')) {
							node.attr('data-btnLinkId', 'btnLinkId-' + btnLinkId);
							node.ancestor().next().attr('data-btnLinkId', 'btnLinkId-' + btnLinkId);
							btnLinkId++;
						}
					}
				);
			}

			var currentScope;

			var divider = A.one('.pass-fail-divider');
			var lastFail = A.one('.last-fail');
			var sidebar = A.one('.sidebar');
			var xmlLog = A.one('.xml-log');

			var failDivs = xmlLog.all('.fail-divider');

			var collapsePairIndex = 0;
			var passFailHeight = 0;
			var inCommandLogMode = false;

			var WIN = A.getWin();

			function init() {
				sidebar.delegate(
					'click',
					linkFunction,
					'.linkable'
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
					'.screen-shot-btn'
				);

				var logBtn = sidebar.one('.btn-command-log');

				logBtn.on(
					'click',
					commandLog
				);

				var sidebarBtn = sidebar.one('.btn-sidebar');

				sidebarBtn.on(
					'click',
					resizeXmlLog
				);

				if (lastFail) {
					expandTree(lastFail);
					scrollToNode(lastFail);
				}
			}

			init();

			function expandTree(node) {
				var tree = node.ancestors('.child-container');

				tree.each(
					function(target) {
						if (target.hasClass('collapse')) {
							collapseToggle(null, target);
						}
					}
				);
			}

			function commandLog(event) {
				var currentTarget = event.currentTarget;

				inCommandLogMode = !inCommandLogMode;

				var commandLog = sidebar.one('.command-log');

				currentTarget.toggleClass('toggle');

				var newHeight = 0;
				var newWidth = '20%';

				var collapsing = !currentTarget.hasClass('toggle');

				if (!collapsing) {
					newHeight = WIN.height();
					newWidth = '40%';
					commandLog.toggleClass('collapse');
				}

				else {
					commandLog.setStyle('height', commandLog.innerHeight());
				}

				sidebar.setStyle('width', newWidth);
				resizeXmlLog();

				commandLog.transition(
					{
						height: {
							duration: 0.5,
							easing: 'ease-out',
							value: newHeight
						}
					},
					function() {
						callback(commandLog, collapsing, true)
						setTimeout(resetDividerHeight, 400);
					}
				);
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

				setTimeout(resetDividerHeight, 600);
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

			function resetDividerHeight(collapsing, node, heightDiff) {
				var defaultReset = !node;
				if (!lastFail) {
					divider.setStyle('height', '100%');
				}

				else if (defaultReset || (passFailHeight === 0) || (node.getY() <= passFailHeight)) {
					var firstClosedPending;
					var pending;

					if (!defaultReset) {
						pending = node.ancestor().hasClass('pending');
					}
					if (collapsing) {
						if (pending) {
							firstClosedPending = node.previous();
						}
						else {
							heightDiff = node.attr('data-prevHeight');

							passFailHeight -= heightDiff;

							manageHeightDiff(-heightDiff, node);
						}
					}
					else if (pending || defaultReset) {
						firstClosedPending = xmlLog.one('.pending > .collapse, .last-fail');

						if (!firstClosedPending.hasClass('last-fail')) {
							firstClosedPending = firstClosedPending.previous();
						}
					}
					else {
						passFailHeight += heightDiff;

						node.attr('data-prevHeight', heightDiff);

						manageHeightDiff(heightDiff, node);
					}
					if (firstClosedPending) {
						var firstClosedLiHeight = firstClosedPending.outerHeight();
						var firstClosedLiY = firstClosedPending.getY();

						passFailHeight = (firstClosedLiY + firstClosedLiHeight);
					}
					divider.setStyle('height', passFailHeight);

					recalculateHeights();
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
				var currentTarget = event.currentTarget;

				var linkedFunction = getLink(currentTarget, 'li', 'data-functionLinkId', xmlLog);

				linkedFunction.toggleClass('linked');

				expandTree(linkedFunction);

				scrollToNode(linkedFunction);
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
					if (targetNode.getStyle('height') != '0px') {
						height = targetNode.outerHeight();

						targetNode.setStyle('height', height);

						getTransition(targetNode, height, true, resetHeights);

						running = targetNode;
					}
					else {
						var lastChild = targetNode.getDOMNode().lastElementChild;

						lastChild = A.Node(lastChild);

						targetNode.removeClass('collapse');

						var lastChildY = lastChild.getY();
						var lastChildHeight = lastChild.innerHeight();
						var lastChildBottomY = lastChildY + lastChildHeight + 1;

						height = (lastChildBottomY - targetNode.getY());

						console.log(height)
						console.log(targetNode)

						getTransition(targetNode, height, false, resetHeights);
					}
					return true;
				}
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
				if(resetHeights) {
					reset = resetDividerHeight(collapsing, targetNode, height);
				}

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
					scopeCommandLog(scope);
					event.stopPropagation();
				}
			}

			function scopeCommandLog(scope) {
				if (scope.hasClass('macro')) {
					var macroScope = scope.all('[data-functionLinkId]');
					if (macroScope.item(0)) {
						scrollToNode(macroScope.item(0), true);
					}

					macroScope.each(
						function(node) {
							var scoped = getLink(node, '.linkable', 'data-functionLinkId', sidebar);

							scoped.toggleClass('yolo');
						}
					);
				}
				else if (scope.hasClass('function')) {
					var scoped = getLink(scope, '.linkable', 'data-functionLinkId', sidebar);
					scrollToNode(scoped, true);

					scoped.toggleClass('yolo');
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

			function scrollToNode(node, inSidebar) {
				var scrollNode = WIN;
				if (inSidebar) {
					scrollNode = sidebar.one('.command-log');
				}

				var winHalf = (WIN.height() / 2);

				var halfNodeHeight = (node.innerHeight() / 2);

				var offset = (winHalf - halfNodeHeight);

				var yDistance = (node.getY() - offset);

				console.log(node.getY());
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
				console.log('scroll')

				scroll.run();
			}

			function showError(event) {
				var currentTarget = event.currentTarget;

				currentTarget.toggleClass('toggle');

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
