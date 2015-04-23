YUI.add(
	'liferay-qa-poshi-logger',
	function(A) {
		var Lang = A.Lang;

		var BODY = A.getBody();
		var WIN = A.getWin();

		var PoshiLogger = A.Component.create({

			NAME: 'poshilogger',

			ATTRS: {
				currentScope: {
					setter: A.one
				},

				commandLogId: {
					value: null
				},

				commandLogScope: {
					value: new A.NodeList()
				},

				fails: {
					setter: A.all,
					valueFn: function() {
						var instance = this;

						var contentBox = instance.get('contentBox');

						return contentBox.all('.fail');
					}
				},

				prevNode: {
					setter: A.one
				},

				running: {
					value: null
				},

				sidebar: {
					setter: A.one
				},

				status: {
					validator: Lang.isArray,
					value: ['fail', 'pass', 'pending']
				}
			},

			prototype: {
				bindUI: function() {
					var instance = this;

					instance.bindSidebar();
					instance.bindXMLLog();
				},

				renderUI: function() {
					var instance = this;

					var contentBox = instance.get('contentBox');
					var sidebar = instance.get('sidebar');

					var commandLog = sidebar.one('.command-log');

					contentBox.toggleClass('running');

					instance.toggleCommandLog(commandLog);
				},

				bindSidebar: function() {
					var instance = this;

					var sidebar = instance.get('sidebar');

					sidebar.delegate(
						'click',
						A.bind('handleCurrentCommandSelect', instance),
						'.linkable .line-container'
					);

					sidebar.delegate(
						'click',
						A.rbind('handleToggleCollapseClick', instance, true),
						'.expand-toggle'
					);

					var logBtn = sidebar.all('.btn-command-log');

					logBtn.on('click', A.bind('handleToggleCommandLogClick', instance));

					var sidebarBtn = sidebar.one('.btn-sidebar');

					sidebarBtn.on('click', A.bind('handleResizeXmlLogClick', instance));

					var jumpToError = sidebar.one('.btn-jump-to-error');

					jumpToError.on('click', A.bind('handleGoToErrorClick', instance));

				},

				bindXMLLog: function() {
					var instance = this;

					var contentBox = instance.get('contentBox');

					contentBox.delegate(
						'mouseover',
						A.bind('handleXmlNodeHover', instance),
						'.function, .macro, .test-group'
					);

					contentBox.delegate(
						'click',
						A.bind('handleCurrentScopeSelect', instance),
						'.function, .macro, .test-group'
					);

					contentBox.delegate(
						'click',
						A.bind('handleFullScreenImageClick', instance),
						'.screenshot-container img, .fullscreen-image'
					);

					contentBox.delegate(
						'click',
						A.rbind('handleToggleCollapseClick', instance, false),
						'.btn-collapse, .btn-var'
					);

					contentBox.delegate(
						'click',
						A.bind('handleErrorButtonsClick', instance),
						'.error-btn, .screenshot-btn'
					);
				},

				collapseTransition: function(targetNode, resetHeights) {
					var instance = this;

					var returnVal = false;

					var running = instance.get('running');

					if (targetNode && (!running || !running.contains(targetNode))) {
						var height;

						var collapsing = (targetNode.getStyle('height') != '0px');

						if (collapsing) {
							height = targetNode.outerHeight();

							targetNode.setStyle('height', height);

							instance.set('running', targetNode);
							targetNode.addClass('transitioning');
						}
						else {
							var lastChild = targetNode.getDOMNode().lastElementChild;

							lastChild = A.Node(lastChild);

							targetNode.removeClass('collapse');
							targetNode.addClass('transitioning');

							var lastChildY = lastChild.getY();
							var lastChildHeight = lastChild.innerHeight();

							var lastChildBottomY = (lastChildY + lastChildHeight + 1);

							height = (lastChildBottomY - targetNode.getY());
						}

						instance.getTransition(targetNode, height, collapsing, resetHeights);

						returnVal = true;
					}

					return returnVal;
				},


				getTransition: function(targetNode, height, collapsing, resetHeights) {
					var instance = this;

					var duration = (Math.pow(height, 0.35) / 15);

					var ease = 'ease-in';

					if (collapsing) {
						ease = 'ease-out';

						height = 0;
					}

					targetNode.transition(
						{
							height: {
								duration: duration,
								easing: ease,
								value: height
							}
						},
						function() {
							if (collapsing) {
								targetNode.addClass('collapse');
							}
							else {
								targetNode.setStyle('height', 'auto');
							}

							instance.set('running', null);

							targetNode.removeClass('transitioning');
						}
					);
				},

				displayNode: function(node) {
					var instance = this;

					node = node || instance.get('fails').last();

					var childContainer = node.ancestors('.child-container');

					if (childContainer) {
						instance.expandParentContainers(childContainer, node);
					}
				},

				getSidebarLogNode: function(logId) {
					var instance = this;

					logId = logId || instance.get('commandLogId');

					var sidebar = instance.get('sidebar');

					return sidebar.one('.command-log[data-logId="' + logId + '"]');
				},

				handleCurrentScopeSelect: function(event) {
					var instance = this;

					var currentTarget = event.currentTarget;

					event.stopPropagation()

					if (!event.target.test('.btn, .btn-container')) {
						var currentScope = instance.get('currentScope');

						if (currentScope) {
							currentScope.removeClass('current-scope');
						}

						currentTarget.addClass('current-scope');
						instance.set('currentScope', currentTarget);
						instance.displayNode(currentTarget);
						instance.parseCommandLog(currentTarget);
					}
				},

				handleErrorButtonsClick: function(event) {
					var instance = this;

					var currentTarget = event.currentTarget;

					currentTarget.toggleClass('toggle');

					var contentBox = instance.get('contentBox');

					var errorLinkId = currentTarget.attr('data-errorLinkId');

					var errorPanel = contentBox.one('.errorPanel[data-errorLinkId="' + errorLinkId + '"]');

					if (errorPanel) {
						errorPanel.toggleClass('toggle');
					}
				},

				handleCurrentCommandSelect: function(event) {
					var instance = this;

					var contentBox = instance.get('contentBox');

					var currentTargetAncestor = event.currentTarget.ancestor();

					if (currentTargetAncestor) {
						var currentScope = instance.get('currentScope');

						if (currentScope) {
							currentScope.removeClass('current-scope');
						}

						instance.parseCommandLog(currentTargetAncestor, true);

						var functionLinkId = currentTargetAncestor.attr('data-functionLinkId');

						var linkedFunction = contentBox.one('li[data-functionLinkId="' + functionLinkId + '"]');

						linkedFunction.addClass('current-scope');

						instance.set('currentScope', linkedFunction);

						instance.displayNode(linkedFunction);
					}
				},

				handleFullScreenImageClick: function(event) {
					var instance = this;

					var currentTarget = event.currentTarget;

					var src = currentTarget.attr('src');

					var fullScreenImage = A.one('.fullscreen-image');

					if (fullScreenImage.hasClass('toggle')) {
						fullScreenImage.append(A.Node.create('<img alt="fullscreen screenshot" src="' + src + '">'));
					}
					else {
						fullScreenImage.one('*').remove(true);
					}

					fullScreenImage.toggleClass('toggle');
				},

				handleGoToErrorClick: function(event) {
					var instance = this;

					instance.displayNode();
				},

				handleXmlNodeHover: function(event) {
					var instance = this;

					event.stopPropagation();

					var prevNode = instance.get('prevNode');

					if (prevNode) {
						prevNode.removeClass('hover');
					}

					var currentTarget = event.currentTarget;

					currentTarget.addClass('hover');

					instance.set('prevNode', currentTarget);
				},

				handleToggleCommandLogClick: function(event) {
					var instance = this;

					var sidebar = instance.get('sidebar');

					var currentTarget = event.currentTarget;

					var logId = currentTarget.attr('data-logId');

					var commandLog = instance.getSidebarLogNode(logId);

					instance.toggleCommandLog(commandLog, currentTarget);
				},

				handleToggleCollapseClick: function(event, inSidebar) {
					var instance = this;

					var currentTarget = event.currentTarget;

					var contentBox = instance.get('contentBox');

					var linkId = currentTarget.attr('data-btnLinkId');

					if (inSidebar) {
						contentBox = instance.get('sidebar');
					}

					var collapsibleNode = contentBox.one('.collapsible[data-btnLinkId="' + linkId + '"]');

					instance.toggleNode(collapsibleNode, currentTarget, inSidebar);
				},

				handleResizeXmlLogClick:function(event) {
					var instance = this;

					var currentTarget = event.currentTarget;

					if (currentTarget.hasClass('toggle')) {
						instance.setXmlLogDimensions();
					}
					else {
						instance.resizeXmlLog(100, 100);
					}

					currentTarget.toggleClass('toggle');
				},

				selectCurrentNode: function(node) {
					var instance = this;

					var currentScope = instance.get('currentScope');

					if (currentScope) {
						currentScope.removeClass('current-scope');
					}

					node.addClass('current-scope');

					instance.parseCommandLog(node);

					instance.scopeSidebar();
				},

				parseCommandLog: function(node) {
					var instance = this;

					var commandLogScope = instance.get('commandLogScope');

					if (commandLogScope) {
						commandLogScope.removeClass('current-scope');
					}
					instance.set('commandLogScope', new A.NodeList());

					if (node.hasClass('macro')) {
						var macroScope = node.all('[data-functionLinkId]');

						for (var i = 0; i < macroScope.size(); i++) {
							instance.scopeCommandLog(macroScope.item(i));
						}
					}
					else {
						instance.scopeCommandLog(node);
					}

					var commandLogScope = instance.get('commandLogScope');

					instance.scrollToNode(commandLogScope.first(), true);
				},

				refreshXmlLog: function(node) {
					var instance = this;

					instance.displayNode(node);

					instance.selectCurrentNode(node);
				},

				refreshXmlError: function(command) {
					var instance = this;

					var consoleLog = command.one('.console');
					var screenshot = command.one('.screenshots');

					var functionLinkId = command.attr('data-functionLinkId')

					var failedFunction = instance.get('contentBox').one('.line-group[data-functionLinkId="' + functionLinkId + '"');

					if (consoleLog && screenshot && failedFunction) {
						var btnContainer = failedFunction.one('.btn-container');

						var imgBefore = screenshot.one('.before');
						var imgAfter = screenshot.one('.after');

						var screenshotError = screenshot.attr('data-errorLinkId')
						var consoleError = consoleLog.attr('data-errorlinkid');

						btnContainer.append(A.Node.create('<button class="btn screenshot-btn" data-errorlinkid="' + screenshotError + '"><div class="btn-content"></div></button>'));
						btnContainer.append(A.Node.create('<button class="btn error-btn" data-errorlinkid="' + consoleError + '"><div class="btn-content"></div></button>'));

						failedFunction.prepend(screenshot.clone());
						failedFunction.append(consoleLog.clone());
					}
				},

				resizeXmlLog: function(xmlLogWidth, translation) {
					var instance = this;

					instance.get('sidebar').setStyle('transform', 'translateX(' + translation + '%)');

					instance.get('contentBox').setStyle('width', xmlLogWidth + '%');
				},

				scopeCommandLog: function(node) {
					var instance = this;

					var buffer = [];

					if (node) {
						var sidebar = instance.get('sidebar');

						var functionLinkId = node.attr('data-functionLinkId');

						node = sidebar.all('.linkable[data-functionLinkId="' + functionLinkId + '"]');

						while(node.size()) {
							var lastEl = node.pop();

							buffer.push(lastEl);
						}
					}

					var commandLogScope = instance.get('commandLogScope');

					commandLogScope = commandLogScope.concat(buffer);

					instance.set('commandLogScope', commandLogScope);

					commandLogScope.addClass('current-scope');
				},

				scrollToNode: function(node, inSidebar) {
					var instance = this;

					var scrollNode = WIN;

					if (node) {
						var halfNodeHeight = (node.innerHeight() / 2);

						var halfWindowHeight = (WIN.height() / 2);

						var offsetHeight = (halfWindowHeight - halfNodeHeight);

						var nodeY = node.getY();

						if (inSidebar) {
							var commandLogId = instance.get('commandLogId');
							var sidebar = instance.get('sidebar');

							scrollNode = instance.getSidebarLogNode();

							var dividerLine = scrollNode.one('.divider-line');

							if (dividerLine) {
								nodeY = (nodeY - dividerLine.getY());
							}
						}

						var yDistance = (nodeY - offsetHeight);

						new A.Anim(
							{
								duration: 2,
								easing: 'easeOutStrong',
								node: scrollNode,
								to: {
									scroll: [0, yDistance]
								}
							}
						).run();
					}
				},

				setXmlLogDimensions: function() {
					var instance = this;

					var sidebar = instance.get('sidebar');

					var sidebarWidth = sidebar.getStyle('width');

					sidebarWidth = Lang.toInt(sidebarWidth);

					var xmlLogWidth = (100 - sidebarWidth);

					instance.resizeXmlLog(xmlLogWidth, 0);
				},

				expandParentContainers: function(childContainer, node) {
					var instance = this;

					var timeout = 0;

					var childNode = childContainer.shift();

					if (childNode.hasClass('collapse')) {
						instance.toggleNode(childNode);

						timeout = 200;
					}

					if (childContainer.size()) {
						setTimeout(
							A.bind(
								'expandParentContainers',
								instance,
								childContainer,
								node
							),
							timeout
						);
					}
					else {
						instance.scrollToNode(node);
					}
				},

				toggleCommandLog: function(commandLog, button) {
					var instance = this;

					var commandLogId = instance.get('commandLogId');
					var sidebar = instance.get('sidebar');

					var logId = commandLog.attr('data-logId');

					button = button || sidebar.one('.btn-command-log[data-logId="' + logId + '"]');

					button.toggleClass('toggle');

					if (!commandLogId) {
						instance.set('commandLogId', logId);
					}
					else {
						if (commandLogId === logId) {
							instance.set('commandLogId', null);
						}
						else {
							var currentActiveLog = instance.getSidebarLogNode();

							instance.toggleCommandLog(currentActiveLog);

							instance.set('commandLogId', logId);
						}
					}

					var selector = 'data-status' + logId;

					var status = instance.get('status');

					for (var i = 0; i < status.length; i++) {
						var currentStatus = status[i];

						var currentStatusNodes = A.all('[' + selector + '="' + currentStatus + '"]');

						currentStatusNodes.toggleClass(currentStatus);
					}

					instance.transitionCommandLog(commandLog);

					var fails = instance.get('fails');

					if (fails) {
						fails.each(
							function(item) {
								instance.refreshXmlLog(item);
							}
						);
					}

					instance.get('contentBox').toggleClass('link-run-log');
				},

				toggleNode: function(collapsibleContainer, collapsibleBtn, inSidebar) {
					var instance = this;

					var resetHeights = false;

					if (!inSidebar) {
						resetHeights = true;

						var linkId = collapsibleContainer.attr('data-btnLinkId');

						collapsibleBtn = instance.get('contentBox').one('.btn[data-btnLinkId="' + linkId + '"]');
					}

					var collapsed = instance.collapseTransition(collapsibleContainer, resetHeights);

					if (collapsed) {
						collapsibleBtn.toggleClass('toggle');
					}
				},

				transitionCommandLog: function(commandLog) {
					var instance = this;

					var newHeight = 0;

					var commandLogId = instance.get('commandLogId');
					var sidebar = instance.get('sidebar');

					sidebar.toggleClass('commandLog');

					instance.setXmlLogDimensions();

					commandLog.toggleClass('collapse');

					var lastChildLog = commandLog.one('ul:last-child');

					if (lastChildLog.hasClass('collapse')) {
						var linkId = lastChildLog.attr('data-btnLinkId');

						var collapseBtn = sidebar.one('.btn[data-btnLinkId="' + linkId + '"]');

						instance.toggleNode(lastChildLog, collapseBtn, true);
					}

					var commandLogScope = instance.get('commandLogScope');

					if (commandLogScope && commandLogId) {
						instance.scrollToNode(commandLogScope.first(), true);
					}
				},

				scopeSidebar: function() {
					var instance = this;

					var currentScope = instance.get('currentScope');

					if (currentScope) {
						var sidebar = instance.get('sidebar');

						var sidebarParameterTitle = sidebar.one('.parameter .title');
						var sidebarParameterList = sidebar.one('.parameter .parameter-list');

						var scopeNames = currentScope.all('> .line-container .name');
						var scopeTypes = currentScope.all('> .line-container .tag-type');

						var scopeName = scopeNames.first();
						var scopeType = scopeTypes.first();

						if (scopeName) {
							scopeName = scopeName.html();
						}
						else {
							scopeName = currentScope.one('.testCaseCommand');

							if (scopeName) {
								scopeName = scopeName.html();
							}
						}

						if (scopeType && (scopeType.html() != 'name')) {
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

						var sidebarScopeName = sidebar.one('.scope-type .scope-name');
						var sidebarScopeTitle = sidebar.one('.scope-type .title');

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
			}
		});

		A.PoshiLogger = PoshiLogger;
	},
	'',
	{
		requires: ['aui-component', 'anim', 'aui-base', 'aui-node', 'event', 'resize', 'transition', 'widget']
	}
);