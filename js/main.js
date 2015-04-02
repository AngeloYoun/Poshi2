YUI().ready(
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

		var collapseBtns = xmlLog.all('.pending > .btn-container .btn-collapse');
		var failDivs = xmlLog.all('.fail-divider');

		var collapsePairIndex = 0;
		var passFailHeight = 0;

		var WIN = A.getWin();

		var treeToFail = lastFail.ancestors('ul');

		init();

		function init() {

			expandTree(lastFail);

			sidebar.delegate(
				'click',
				linkFunction,
				'.linkable'
			)

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
				function(event) {
					var currentTarget = event.currentTarget;

					var commandLog = sidebar.one('.command-log');

					currentTarget.toggleClass('toggle');


					if (currentTarget.hasClass('toggle')) {
						sidebar.setStyle('width', '40%');
						xmlLog.setStyle('width', '60%');

						commandLog.toggleClass('hidden')

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

						commandLog.setStyle('height', commandLog.innerHeight())

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
			);

			var sidebarBtn = sidebar.one('.btn-sidebar');
			sidebarBtn.on(
				'click',
				function(event) {
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
			);

			var errorBtns = xmlLog.all('.error-btn');

			errorBtns.on(
				'click',
				function(event) {
					var currentTarget = event.currentTarget;

					var container = currentTarget.ancestor('li');

					if (container) {
						var errorConsole = container.one('.console');

						if (errorConsole) {
							errorConsole.toggleClass('hidden');
						}
					}
				}
			);

			var screenshotBtns = A.all('.screen-shot-btn');

			screenshotBtns.on(
				'click',
				function(event) {
					var currentTarget = event.currentTarget;

					var container = currentTarget.ancestor('li');

					if (container) {
						var screenshots = container.one('.screenshots');

						if (screenshots) {
							screenshots.toggleClass('hidden');
						}
					}
				}
			);

			var scroll = scrollToNode(lastFail);

			scroll.run();
		}

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

		function recalculateHeights() {
			failDivs.each(
				function(node) {
					var lineContainer = node.next();

					var newHeight = lineContainer.outerHeight();

					node.setStyle('height', newHeight);
				}
			);
		}

		var isRunning = null;
		var newExpandHeight;

		function resetDividerHeight(newHeight, node) {
			if ((passFailHeight === 0) || (node.getY() <= passFailHeight)) {
				var isPending = false;

				var firstClosedLi = lastFail;
				var newDivider;

				for (var i = 1; i < treeToFail.size(); i++) {
					var target = treeToFail.item(i);

					if (node === target) {
						isPending = true;
					}

					if (target.getStyle('display') == 'none') {
						firstClosedLi = target.previous();

						break;
					}
				}

				var lineContainer = node.previous();

				if (newHeight === 0) {
					if (isPending) {
						var containerY = lineContainer.getY();
						var containerHeight = lineContainer.outerHeight();

						passFailHeight = (containerY + containerHeight);
					}
					else {
						if(!isRunning) {
							passFailHeight -= node.outerHeight();
						}
					}

					newExpandHeight = passFailHeight;
					divider.setStyle('height', passFailHeight);
				}
				else {
					if (isPending) {
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

			var scroll = scrollToNode(linkedFunction);

			scroll.run();
		}

		function collapseToggle(event, collapseContainer) {
			var collapseBtn

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

			if (targetNode) {

				if (targetNode.getStyle('height') != '0px') {
					if(isRunning === targetNode || !isRunning) {
						console.log('fired')
						var newHeight = targetNode.outerHeight();

						var transDuration = (Math.pow(newHeight, 0.35) / 15);

						targetNode.setStyle('height', newHeight);

						targetNode.transition(
							{
								height: {
									duration: transDuration,
									easing: 'ease-out',
									value: 0
								},
								on: {
									start: resetDividerHeight(0, targetNode)
								}
							},
							function() {
								isRunning = null;
								this.addClass('collapsed');
							}
						);
					}
				}
				else {
					var lastChild = targetNode.getDOMNode().lastElementChild;

					lastChild = A.Node(lastChild);

					targetNode.removeClass('collapsed');

					var lastChildY = lastChild.getY();
					var lastChildHeight = lastChild.innerHeight();

					var lastChildBottomY = lastChildY + lastChildHeight + 1;

					var newHeight = (lastChildBottomY - targetNode.getY());

					var transDuration = (Math.pow(newHeight, 0.35) / 15);

					isRunning = targetNode;

					targetNode.transition({
							height: {
								duration: transDuration,
								easing: 'ease-in',
								value: newHeight
							},
							on: {
								start: resetDividerHeight(newHeight, targetNode)
							}
						},
						function() {
							this.setStyle('height', 'auto');

							passFailHeight = newExpandHeight;

							isRunning = null;
						}
					);
				}
			}
		}

		function getLink(node, selector, attrName, scope) {
			linkId = node.attr(attrName);
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

				if (scopeType === 'macro') {
					var parameters = currentScope.all('> .line-container .parameter-container .parameter-value');

					var parameterCount = parameters.size();

					for(i = 0; i < parameterCount; i += 2) {
						sidebarParameterList.append(A.Node.create('<li class="parameter-name">' + parameters.item(i).html() + '</div>'));
						sidebarParameterList.append(A.Node.create('<li class="parameter-value">' + parameters.item(i + 1).html() + '</div>'));
					}
				}
				else if (scopeType === 'function') {
					var parameterCount = (scopeNames.size() - 1);

					for(i = 1; i <= parameterCount; i++) {
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

			return new A.Anim(
				{
					duration: 2,
					easing: 'easeOutStrong',
					node: WIN,
					to: {
						scroll: [0, yDistance]
					}
				}
			);
		}

		function testClickable(testNode) {
			return !testNode.test('.btn, .btn-container, polygon, svg');
		}

		function testScopeable(testNode) {
			return testNode.hasClass('macro') || testNode.hasClass('function');
		}
	}
);