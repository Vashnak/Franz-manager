import React from 'react';
import Konva from 'konva';
import BrokersService from '../../services/BrokersService';
import WebFont from 'webfontloader';
import numeral from 'numeral';

import ClustersService from "../../services/ClustersService";
import TopicsService from "../../services/TopicsService";
import {KafkaIcon, PartitionIcon, TopicsIcon, ZookeeperIcon} from "../../services/SvgService";
import ThemesStore from "../../stores/ThemesStore";
import Loader from "../../components/loader/Loader";
import MetricsService from "../../services/MetricsService";

const hexagonesWidth = 108;
const hexagonesMargin = 6;

class Dashboard extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            clusters: [],
            loading: true,
            selectedCluster: ClustersService.getSelectedClusterId(),
            selectedTheme: ThemesStore.getTheme().maps,
            stats: {
                topics: '-',
                zookeeper: '-',
                brokers: '-',
                status: '-'
            },
            brokersStats: {}
        };

        this.firstDraw = true;
    }

    componentWillMount() {
        this.themeStore = ThemesStore.watch(data => {
            if (data.action === 'UPDATE') {
                this.setState({
                    selectedTheme: data.theme.maps
                }, () => {
                    this._clearEverythingAndRedraw();
                });
            }
        });
        let clusters;
        ClustersService.getClusters()
            .then(clusters => {
                return Promise.all(clusters.map(c => {
                    return new Promise((resolve, reject) => {
                        BrokersService.getBrokers(c.name)
                            .then(brokers => {
                                c.brokers = brokers;
                                c.zookeeper = brokers[0].configurations['zookeeper.connect'].split('/')[0];
                                resolve(c)
                            })
                    })
                }))
            })
            .then(c => {
                clusters = c;
                return this._loadMetrics();
            })
            .then(() => {
                let cpt = 0;
                WebFont.load({
                    google: {
                        families: ['Inconsolata', 'Roboto Condensed', 'Roboto']
                    },
                    fontactive: (e) => {
                        cpt++;
                        if (cpt === 3) {
                            this.setState({clusters, loading: false});
                            this._initCanvas();
                        }
                    }
                });
                return this._loadClusterStats();
            });
    }

    componentWillUnmount() {
        ThemesStore.unwatch(this.themeStore);
        window.removeEventListener('resize', this._handleResize.bind(this));
    }

    componentDidMount() {
        this.refs.konva.addEventListener('DOMMouseScroll', this._onMouseScroll.bind(this), false);
        this.refs.konva.addEventListener('mousewheel', this._onMouseScroll.bind(this), false);
        window.addEventListener('resize', this._handleResize.bind(this));
    }

    _loadMetrics() {
        return new Promise((resolve, reject) => {
            const wantedMetrics = [
                {
                    label: 'Bytes in (per sec)',
                    location: 'kafka.server',
                    type: 'BrokerTopicMetrics',
                    name: 'BytesInPerSec'
                },
                {
                    label: 'Bytes out (per sec)',
                    location: 'kafka.server',
                    type: 'BrokerTopicMetrics',
                    name: 'BytesOutPerSec'
                },
                {
                    label: 'Messages in (per sec)',
                    location: 'kafka.server',
                    type: 'BrokerTopicMetrics',
                    name: 'MessagesInPerSec'
                },
                {label: 'Partition count', location: 'kafka.server', type: 'ReplicaManager', name: 'PartitionCount'},
                {label: 'Leader count', location: 'kafka.server', type: 'ReplicaManager', name: 'LeaderCount'},
                {
                    label: 'Under replicated',
                    location: 'kafka.server',
                    type: 'ReplicaManager',
                    name: 'UnderReplicatedPartitions'
                },
                {
                    label: 'Active controller',
                    location: 'kafka.controller',
                    type: 'KafkaController',
                    name: 'ActiveControllerCount'
                },
                {label: 'Memory Heap', location: 'java.lang', type: 'Memory', name: 'HeapMemoryUsage'},
                {label: 'Load average', location: 'java.lang', type: 'OperatingSystem', name: null}
            ];

            Promise.all(wantedMetrics.map(metric => MetricsService.getMetrics(metric.location, metric.type, metric.name)))
                .then(brokersMetrics => {
                    const brokersStats = {};
                    brokersMetrics.forEach(brokersMetric => {
                        brokersMetric.forEach(brokerMetric => {
                            if (!brokersStats[brokerMetric.brokerId]) brokersStats[brokerMetric.brokerId] = [];
                            if (brokerMetric.type === 'ReplicaManager') {
                                brokersStats[brokerMetric.brokerId].push({
                                    label: wantedMetrics.find(m => m.name === brokerMetric.name).label,
                                    key: brokerMetric.name,
                                    value: brokerMetric.metrics.Value
                                })
                            } else if (brokerMetric.type === 'OperatingSystem') {
                                brokersStats[brokerMetric.brokerId].push({
                                    label: wantedMetrics.find(m => m.name === brokerMetric.name).label,
                                    key: "LoadAverage",
                                    value: parseInt(brokerMetric.metrics.ProcessCpuLoad * 100)
                                })
                            } else if (brokerMetric.type === 'KafkaController') {
                                brokersStats[brokerMetric.brokerId].push({
                                    label: 'isActiveController',
                                    key: brokerMetric.name,
                                    value: brokerMetric.metrics.Value === 1
                                })
                            } else if (brokerMetric.type === 'BrokerTopicMetrics') {
                                brokersStats[brokerMetric.brokerId].push({
                                    label: wantedMetrics.find(m => m.name === brokerMetric.name).label,
                                    key: brokerMetric.name,
                                    value: brokerMetric.metrics.OneMinuteRate
                                })
                            } else if (brokerMetric.type === 'Memory') {
                                brokersStats[brokerMetric.brokerId].push({
                                    label: wantedMetrics.find(m => m.name === brokerMetric.name).label,
                                    key: brokerMetric.name,
                                    value: (brokerMetric.metrics.used / brokerMetric.metrics.max * 100).toFixed(1)
                                })
                            }
                        });
                    });
                    this.setState({brokersStats});
                    resolve();
                })
                .catch(reject);
        })
    }

    _handleResize() {
        this._clearEverythingAndRedraw();
    }

    _clearEverythingAndRedraw() {
        this.mainLayer.destroy();
        this.mainLayer = null;
        this.stage.destroy();
        this.stage = null;
        this.firstDraw = true;
        this.keepMatrix = true;
        this._initCanvas()
    }

    _loadClusterStats() {
        let stats = {
            topics: '-',
            zookeeper: '-',
            brokers: '-',
            status: '-',
            partitions: '-'
        };
        this.setState({stats});
        TopicsService.getTopics(true)
            .then(topics => {
                stats.topics = topics.length;
                stats.partitions = topics.reduce((prev, next) => prev + next.partitions, 0);
                this.setState({stats});
            });
        BrokersService.getBrokers(this.state.selectedCluster)
            .then(brokers => {
                stats.brokers = brokers.length;
                stats.zookeeper = brokers[0].configurations['zookeeper.connect'].split(',').length;
                stats.status = 'OK';
                this.setState({stats});
            });

    }

    _onMouseScroll(event) {
        let prop = event.deltaY ? "deltaY" : "detail";
        let oldScale = this.stage.scaleX();
        let mousePointTo = {
            x: this.stage.getPointerPosition().x / oldScale - this.stage.x() / oldScale,
            y: this.stage.getPointerPosition().y / oldScale - this.stage.y() / oldScale,
        };

        let newScale = this.stage.scaleX();
        if (event[prop] > 0 && this.stage.scaleX() > 0.6) {
            newScale = this.stage.scaleX() - 0.1
        } else if (event[prop] <= 0 && this.stage.scaleX() < 1.4) {
            newScale = this.stage.scaleX() + 0.1
        }

        this.stage.scale({x: newScale, y: newScale});

        let newPos = {
            x: -(mousePointTo.x - this.stage.getPointerPosition().x / newScale) * newScale,
            y: -(mousePointTo.y - this.stage.getPointerPosition().y / newScale) * newScale
        };

        this.stage.position(newPos);

        this.stage.draw();
    }

    _initCanvas() {
        const konvaContainerRect = this.refs.konva.getBoundingClientRect();
        this.stage = new Konva.Stage({
            container: 'konva',
            width: konvaContainerRect.width,
            height: konvaContainerRect.height,
            draggable: true,
            dragBoundFunc: pos => {
                let minX = (-this.matrix.length * (hexagonesWidth + hexagonesMargin) + hexagonesWidth / 2 + hexagonesMargin) * this.stage.scaleX();
                let minY = (-this.matrix.length * 87 + 87 / 2 + hexagonesMargin) * this.stage.scaleX();
                let x = pos.x;
                let y = pos.y;
                if (x >= 0) x = 0;
                if (x - this.stage.getWidth() <= minX) x = minX + this.stage.getWidth();
                if (y - this.stage.getHeight() <= minY) y = minY + this.stage.getHeight();
                if (y >= 0) y = 0;
                return {
                    x: x,
                    y: y
                };
            }
        });

        this.stage.on('click', this._onStageClick.bind(this));

        this.stage.scale({x: 0.8, y: 0.8});

        if (!this.keepMatrix) {
            this._initMatrix();

            this.clusters = this.state.clusters.reduce((prev, next) => {
                prev.push(next.brokers.map(b => {
                    return {
                        cluster: next.name,
                        type: 'kafka',
                        id: b.id
                    }
                }));
                prev.push(next.zookeeper.split(',').map(z => {
                    return {cluster: next.name, type: 'zookeeper', id: z.split(':')[0].split('.')[3]}
                }));
                return prev;
            }, []);

            let matrixCopy = JSON.parse(JSON.stringify(this.matrix));

            this.clusters.forEach(cluster => {
                let clusterMatrix = generateClusterMatrix(cluster);
                let freePosition = findMatrixFreePosition(matrixCopy, clusterMatrix.length);
                for (let i = freePosition[0]; i < freePosition[0] + clusterMatrix.length; i++) {
                    for (let j = freePosition[1]; j < freePosition[1] + clusterMatrix.length; j++) {
                        matrixCopy[i][j] = clusterMatrix[i - freePosition[0]][j - freePosition[1]];
                    }
                }
            });

            //now center clusters
            let topLeft = null;
            let bottomRight = {x: 0, y: 0};
            for (let j = 0; j < this.matrix.length; j++) {
                for (let i = 0; i < this.matrix[j].length; i++) {
                    if (matrixCopy[i][j] !== -2) {
                        if (!topLeft) topLeft = {x: i, y: j};
                        if (topLeft.x > i) topLeft.x = i;
                        if (topLeft.y > j) topLeft.y = j;
                        if (bottomRight.x < i) bottomRight.x = i;
                        if (bottomRight.y < j) bottomRight.y = j;
                    }
                }
            }

            let totalWidth = bottomRight.x - topLeft.x;
            let totalHeight = bottomRight.y - topLeft.y;

            let beginningX = matrixCopy[0].length / 2 - (Math.round(totalWidth / 2));
            let beginningY = matrixCopy.length / 2 - (Math.round(totalHeight / 2));

            if (beginningY % 2 !== 0) beginningY--;

            for (let i = topLeft.x; i < bottomRight.x + 1; i++) {
                for (let j = topLeft.y; j < bottomRight.y + 1; j++) {
                    this.matrix[beginningX + i][beginningY + j] = matrixCopy[i][j];
                }
            }
        }


        // add canvas element
        this._renderMatrix(this.matrix);
    }

    _initMatrix() {
        const matrixSize = 40;
        this.matrix = [];

        for (let i = 0; i < matrixSize; i++) {
            this.matrix[i] = [];
            for (let j = 0; j < matrixSize; j++) {
                this.matrix[i][j] = -2;
            }
        }
    }

    _selectCluster(clusterName) {
        ClustersService.setSelectedClusterId(clusterName);
        if (this.state.selectedCluster !== clusterName) {
            this.setState({
                selectedCluster: clusterName,
                stats: {
                    topics: '-',
                    zookeeper: '-',
                    brokers: '-',
                    status: '-'
                }
            }, () => {
                this._loadClusterStats();
                this._renderMatrix(this.matrix, true);
                this._focusCluster(clusterName);
            });
        }
    }

    _selectNode(hexagone, node) {
        if (this.selectedNode) {
            this.selectedNode.destroy();
        }
        this.selectedNode = this._generateHexagone(hexagone.position().x, hexagone.position().y, node.type, node.id, true);
        this._drawModal();
    }

    _drawModals(hexagone) {
        this._drawSmallModal(hexagone);
        this.setState({showModal: true});
    }

    _renderModal() {
        const stats = this.state.brokersStats[+this.hoveredNode.attrs.id];

        return !stats ? <div/> : <div className="broker-modal">
            <div className="modal-part">
                <h3 className="modal-part-title">
                    DOWNLOAD/UPLOAD
                </h3>
                <div className="modal-part-content">
                    <div className="modal-part-line">
                        <span className="key">Messages in / s</span>
                        <span className="value">{stats.find(s => s.key === 'MessagesInPerSec').value.toFixed(0)}</span>
                    </div>
                    <div className="modal-part-line">
                        <span className="key">Bytes in / s</span>
                        <span
                            className="value">{numeral(stats.find(s => s.key === 'BytesInPerSec').value.toString()).format('0b')}</span>
                    </div>
                    <div className="modal-part-line">
                        <span className="key">Bytes in / s</span>
                        <span
                            className="value">{numeral(stats.find(s => s.key === 'BytesOutPerSec').value.toString()).format('0b')}</span>
                    </div>
                </div>
            </div>
            <div className="modal-part">
                <h3 className="modal-part-title">
                    PARTITIONS
                </h3>
                <div className="modal-part-content">
                    <div className="modal-part-line">
                        <span className="key">Partitions</span>
                        <span className="value">{stats.find(s => s.key === 'PartitionCount').value.toString()}</span>
                    </div>
                    <div className="modal-part-line">
                        <span className="key">Under replicated</span>
                        <span
                            className="value">{stats.find(s => s.key === 'UnderReplicatedPartitions').value.toString()}</span>
                    </div>
                    <div className="modal-part-line">
                        <span className="key">Leaders</span>
                        <span className="value">{stats.find(s => s.key === 'LeaderCount').value.toString()}</span>
                    </div>
                </div>
            </div>
            <div className="modal-part">
                <h3 className="modal-part-title">
                    OTHER METRICS
                </h3>
                <div className="modal-part-content">
                    <div className="modal-part-line">
                        <span className="key">Load average</span>
                        <span className="value">{stats.find(s => s.key === 'LoadAverage').value.toString()}</span>
                    </div>
                    <div className="modal-part-line">
                        <span className="key">Memory heap</span>
                        <span className="value">{stats.find(s => s.key === 'HeapMemoryUsage').value.toString()}</span>
                    </div>
                </div>
            </div>
        </div>;
    }

    _drawSmallModal(hexagone) {
        let group = hexagone.parent || hexagone.attrs.parent;
        this.drawnHoveredNode = this._generateHexagone(group.position().x, group.position().y, group.attrs.type, group.attrs.id, true);
        let hoveredBroker = this.state.clusters
            .find(c => c.name === this.state.selectedCluster)
            .brokers.find(b => b.id === this.drawnHoveredNode.attrs.id);
        if (this.smallModal) {
            this.smallModal.destroy();
        }
        this.smallModal = new Konva.Group({
            x: this.drawnHoveredNode.x() + hexagonesWidth / 2 - 1,
            y: this.drawnHoveredNode.y() - 5
        });
        let smallModal = new Konva.Rect({
            x: -5,
            y: 2,
            fill: this.state.selectedTheme['layout-colors']['nav-bars'],
            opacity: 0.9,
            width: 400,
            height: 126,
            cornerRadius: 7
        });
        this.smallModal.add(smallModal);
        //title
        this.smallModal.add(newText(76, 36, 'Kafka broker ' + hoveredBroker.id, 28, 'Roboto Condensed', 'bold italic', this.state.selectedTheme['dashboard-colors']['kafka-color']));

        //url
        this.smallModal.add(newText(76, 72, hoveredBroker.host + ':' + hoveredBroker.port, 20, 'Roboto Condensed', '', this.state.selectedTheme["layout-colors"]["1"]));

        let mutableX = 0;
        let mutableY = 0;

        this.smallModal.add(new Konva.Line({
            points: [mutableX, mutableY - 1,
                mutableX += 60, mutableY += 35,
                mutableX, mutableY += 60,
                mutableX -= 60, mutableY += 35,
                mutableX -= 54, mutableY -= 33,
            ],
            fill: this.state.selectedTheme['dashboard-colors']["background"],
            closed: true
        }));

        this.smallModal.add(drawKafkaIcon(167, 22, this.state.selectedTheme['dashboard-colors']["kafka-color"]));
        this.mainLayer.add(this.smallModal);
        this.mainLayer.add(this.drawnHoveredNode);
    }

    _removeModals() {
        if (this.smallModal) {
            this.smallModal.destroy();
            this.smallModal = null;
        }
        if (this.drawnHoveredNode) {
            this.drawnHoveredNode.destroy();
            this.drawnHoveredNode = null;
        }
        this.setState({showModal: false});
    }

    _renderMatrix(matrix, onlyClusters = false) {
        this.mainLayer = this.mainLayer || new Konva.Layer();
        this.clusterHexagones = this.clusterHexagones || [];
        let x;
        let defaultHexagone = this._generateHexagone(0, 0);

        defaultHexagone.cache();

        if (onlyClusters) {
            this.clusterHexagones.forEach(hexagone => {
                hexagone.destroy();
            })
        }

        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[i].length; j++) {
                let y = (87 + hexagonesMargin / 1.25) * (j - 1);
                if (j % 2 === 0) {
                    x = i * hexagonesWidth + i * hexagonesMargin;
                } else {
                    x = i * hexagonesWidth + i * hexagonesMargin - hexagonesWidth / 2 - hexagonesMargin / 2;
                }
                if (matrix[i][j] === -1) {
                    if (!onlyClusters) {
                        let hexagone = this._generateHexagone(x, y, "adjacent");
                        this.mainLayer.add(hexagone);
                    }
                } else if (matrix[i][j] !== -2) {
                    let elem = matrix[i][j];
                    let hexagone = this._generateHexagone(x, y, elem.type, elem.id, false, this.state.selectedCluster !== elem.cluster);
                    if (this.state.selectedCluster === elem.cluster && elem.type === 'kafka') {
                        hexagone.on('mouseenter', () => {
                            this.stage.container().style.cursor = 'pointer';
                        });

                        hexagone.on('mouseleave', () => {
                            this.stage.container().style.cursor = 'default';
                        });
                        hexagone.on('click', () => {
                            this._selectNode(hexagone, matrix[i][j]);
                        });
                    }
                    this.clusterHexagones.push(hexagone);
                    this.mainLayer.add(hexagone);
                } else {
                    if (!onlyClusters) {
                        let clone = defaultHexagone.clone({x, y});
                        this.mainLayer.add(clone);
                    }
                }
            }
        }
        this.mainLayer.on('mousemove', e => {
            let oldNode = this.hoveredNode;
            let newNode = e.target;
            if ((!oldNode && newNode.attrs.isHexagone)
                || (oldNode && oldNode._id !== newNode._id && newNode.attrs.isHexagone)) {
                this._removeModals();

                if (oldNode) {
                    oldNode.fill(oldNode.oldColor);
                }

                this.hoveredNode = newNode;
                this.hoveredNode.oldColor = newNode.fill();
                if (this.hoveredNode.attrs.type === "zookeeper" || this.hoveredNode.attrs.type === "kafka") {
                    this.hoveredNode.fill(shadeColor(newNode.fill(), 10));
                    this._drawModals(this.hoveredNode);
                } else {
                    this.hoveredNode.fill(shadeColor(newNode.fill(), 3));
                }
            }
            this.mainLayer.batchDraw();
        });


        this.mainLayer.batchDraw();
        if (!onlyClusters) {
            this.stage.add(this.mainLayer);
        }
        if (this.firstDraw) {
            this._focusCluster(this.state.selectedCluster);
            this.firstDraw = false;
        }
        this.stage.draw();
    }

    _focusCluster(cluster) {
        let startX = this.matrix.length;
        let startY = this.matrix.length;
        let endX = 0;
        let endY = 0;
        for (let i = 0; i < this.matrix.length; i++) {
            for (let j = 0; j < this.matrix[i].length; j++) {
                if (this.matrix[i][j].cluster && this.matrix[i][j].cluster === cluster) {
                    if (i < startX) startX = i;
                    if (j < startY) startY = j;
                    if (i > endX) endX = i;
                    if (j > endY) endY = j;
                }
            }
        }

        let centerX = (endX + startX) / 2;
        let centerY = (endY + startY) / 2;

        let newX = (centerX * (hexagonesMargin + hexagonesWidth)) * this.stage.scaleX() - (this.stage.getWidth() / 2);
        let newY = (centerY * (hexagonesMargin + 87)) * this.stage.scaleX() - (this.stage.getHeight() / 2);

        this.stage.position({
            x: -newX,
            y: -newY
        });
        this.mainLayer.draw();

        if (this.modal && this.selectedNode) {
            this._clearModalAndSelectedNode();
        }
    }

    _onStageClick(e) {
        let group = e.target.parent;
        if ((!group || !group.attrs || group.attrs.type !== 'kafka') && this.modal) {
            this._clearModalAndSelectedNode();
        }
    }

    _clearModalAndSelectedNode() {
        this.modal.destroy();
        this.modal = null;
        this.selectedNode.destroy();
        this.selectedNode = null;
        this.mainLayer.draw();
    }

    _generateHexagone(x, y, type = "default", id = null, isActive, disabled = false, cluster = null) {
        const group = new Konva.Group({
            x: x,
            y: y,
            type,
            id
        });

        let mutableX = 0;
        let mutableY = 0;

        let hexagonesProperties = {
            points: [mutableX += 54, mutableY,
                mutableX += 54, mutableY += 33,
                mutableX, mutableY += 54,
                mutableX -= 54, mutableY += 33,
                mutableX -= 54, mutableY -= 33,
                mutableX, mutableY -= 54
            ],
            sides: 6,
            fill: this.state.selectedTheme['dashboard-colors'][type + '-color'],
            stroke: this.state.selectedTheme['dashboard-colors'][type + '-color'],
            strokeWidth: 0.5,
            closed: true,
            type,
            id,
            isHexagone: true,
            parent: group
        };

        if (isActive) {
            hexagonesProperties.fill = this.state.selectedTheme['dashboard-colors']['kafka-color'];
            hexagonesProperties.stroke = this.state.selectedTheme['dashboard-colors']['kafka-color'];
        } else if (disabled) {
            hexagonesProperties.fill = this.state.selectedTheme['dashboard-colors']['disabled-background'];
            hexagonesProperties.stroke = this.state.selectedTheme['dashboard-colors']['disabled-background'];
        } else {
            switch (type) {
                case 'adjacent':
                    hexagonesProperties.fill = this.state.selectedTheme['dashboard-colors']['adjacent-hexagone-bc'];
                    hexagonesProperties.stroke = this.state.selectedTheme['dashboard-colors']['adjacent-hexagone-border'];
                    break;
                case 'kafka':
                case 'zookeeper':
                    hexagonesProperties.fill = this.state.selectedTheme['dashboard-colors'][type + '-color'];
                    hexagonesProperties.stroke = this.state.selectedTheme['dashboard-colors'][type + '-color'];
                    hexagonesProperties.opacity = 0.3;
                    break;
                default:
                    hexagonesProperties.fill = this.state.selectedTheme['dashboard-colors']['default-hexagone-bc'];
                    hexagonesProperties.stroke = this.state.selectedTheme['dashboard-colors']['default-hexagone-border'];
                    break;
            }
        }

        const hexagone = new Konva.Line(hexagonesProperties);

        group.add(hexagone);

        if (id) {
            const textId = new Konva.Text({
                y: 15,
                text: id,
                fontSize: 48,
                fontFamily: 'Inconsolata',
                fontStyle: 'bold',
                fill: isActive ? this.state.selectedTheme['dashboard-colors']['kafka-contrast'] :
                    disabled ? this.state.selectedTheme['dashboard-colors']['disabled-color'] : this.state.selectedTheme['dashboard-colors'][type + '-color']
            });
            textId.setAbsolutePosition({x: (hexagone.getWidth() - textId.getTextWidth()) / 2, y: 20});
            group.add(textId);
        }

        if (type && type !== 'default' && type !== 'adjacent') {
            let fontSize = 20;
            const textType = new Konva.Text({
                y: 15,
                text: type.toUpperCase(),
                fontSize: fontSize,
                fontFamily: 'Roboto Condensed',
                fontStyle: 'italic bold',
                fill: isActive ? this.state.selectedTheme['dashboard-colors']['kafka-contrast'] :
                    disabled ? this.state.selectedTheme['dashboard-colors']['disabled-color'] : this.state.selectedTheme['dashboard-colors'][type + '-color']
            });
            while (textType.getWidth() > hexagone.getWidth() - 24) {
                fontSize--;
                textType.setFontSize(fontSize)
            }
            textType.setAbsolutePosition({x: (hexagone.getWidth() - textType.getTextWidth()) / 2, y: 72});
            group.add(textType);
        }

        return group;
    }

    render() {
        return (
            <div className="dashboard-view flex flex-1" ref="view"
                 style={{background: this.state.selectedTheme['dashboard-colors']['background']}}>
                <div id="konva" ref="konva" className="flex-1"/>
                <div className="context-actions cluster-stats">
                    <div className="cluster-stat">
                        <div className="text">
                            <span className="value">{this.state.stats.topics}</span>
                            <span className="label">Topics</span>
                        </div>
                        <div className="icon">
                            <TopicsIcon/>
                        </div>
                    </div>
                    <div className="cluster-stat">
                        <div className="text">
                            <span className="value">{this.state.stats.partitions}</span>
                            <span className="label">Partitions</span>
                        </div>
                        <div className="icon">
                            <PartitionIcon/>
                        </div>
                    </div>
                    <div className="cluster-stat">
                        <div className="text">
                            <span className="value">{this.state.stats.zookeeper}</span>
                            <span className="label">Zookeeper</span>
                        </div>
                        <div className="icon">
                            <ZookeeperIcon/>
                        </div>
                    </div>
                    <div className="cluster-stat">
                        <div className="text">
                            <span className="value">{this.state.stats.brokers}</span>
                            <span className="label">Kafka Brokers</span>
                        </div>
                        <div className="icon kafka">
                            <KafkaIcon/>
                        </div>
                    </div>
                    <div className="cluster-stat">
                        <div className="text">
                            <span className="value"><div className="ellipse ellipse-12px green margin-right-8px"/>
                                {this.state.stats.status}</span>
                            <span className="label">Cluster status</span>
                        </div>
                    </div>
                </div>
                {this.state.loading && <Loader/>}
                {this.state.showModal && this._renderModal()}
            </div>
        );
    }
}

function generateClusterMatrix(cluster) {
    let maxMatrixSize = 0;
    if (cluster.length === 0) return 0;
    if (cluster.length === 1) return 1;
    for (let i = 1; ; i++) {
        let maxElements = 1 + i * 6;
        maxMatrixSize = i * 2 + 3; // +1 because of center and +2 because of lighter hexagones
        if (i > 100 || maxElements >= cluster.length) {
            break;
        }
    }
    let matrix = [];

    for (let i = 0; i < maxMatrixSize; i++) {
        matrix[i] = [];
        for (let j = 0; j < maxMatrixSize; j++) {
            matrix[i][j] = -2;
        }
    }

    let center = (maxMatrixSize - 1) / 2 + 1; // size is always odd.
    matrix = fillMatrixWithCluster(matrix, cluster, center, center);

    const positions = ["topLeft", "topRight", "right", "bottomRight", "bottomLeft", "left"];

    for (let i = 0; i < maxMatrixSize; i++) {
        for (let j = 0; j < maxMatrixSize; j++) {
            if (typeof matrix[i][j] === 'object') {
                positions.forEach(position => {
                    let neighbour = getNeighbourCellPosition(position, i, j);
                    if (matrix[neighbour[0]] && typeof matrix[neighbour[0]][neighbour[1]] !== 'object') {
                        matrix[neighbour[0]][neighbour[1]] = -1;
                    }
                })
            }
        }
    }

    return matrix;
}

function findMatrixFreePosition(matrix, itemsLength) {
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j <= i; j++) {
            if (matrix[j][i - j] === -2 && (i - j) % 2 === 0) {
                let freePosition = true;
                let xLength = j + itemsLength;
                let yLength = i - j + itemsLength;
                for (let x = j; x < xLength; x++) {
                    for (let y = i - j; y < yLength; y++) {
                        if (matrix[x][y] !== -2) {
                            freePosition = false;
                        }
                    }
                }
                if (freePosition) {
                    return [j, i - j];
                }
            }
        }
    }
}

function fillMatrixWithCluster(matrix, cluster, x, y) {
    x--;
    y--;
    let clusterCopy = JSON.parse(JSON.stringify(cluster));
    let matrixCopy = JSON.parse(JSON.stringify(matrix));
    matrixCopy[x][y] = clusterCopy[0];
    clusterCopy.splice(0, 1);
    let center = [x, y];
    while (clusterCopy.length > 0) {
        let freeNeighbourPosition = findFreeNeighbourPosition(matrixCopy, center[0], center[1]);
        if (freeNeighbourPosition) {
            matrixCopy[freeNeighbourPosition[0]][freeNeighbourPosition[1]] = clusterCopy[0];
            clusterCopy.splice(0, 1);
        } else {
            center = getRandomNeighbourPosition(center[0], center[1]);
        }
    }
    return matrixCopy;
}

function findFreeNeighbourPosition(matrix, x, y) {
    let freePosition = shuffleArray(["topLeft", "topRight", "right", "bottomRight", "bottomLeft", "left"]).find(pos => {
        let neighbour = getNeighbourCellPosition(pos, x, y);
        return matrix[neighbour[0]][neighbour[1]] === -2;
    });
    return getNeighbourCellPosition(freePosition, x, y);
}

function getNeighbourCellPosition(position, x, y, reverse = false) {
    switch (position) {
        case "topLeft":
            return y % 2 === 0 ? [x, y - 1] : [x - 1, y - 1];
        case "topRight":
            return y % 2 === 0 ? [x + 1, y - 1] : [x, y - 1];
        case "right":
            return y % 2 === 0 ? [x + 1, y] : [x + 1, y];
        case "bottomRight":
            return y % 2 === 0 ? [x + 1, y + 1] : [x, y + 1];
        case "bottomLeft":
            return y % 2 === 0 ? [x, y + 1] : [x - 1, y + 1];
        case "left":
            return y % 2 === 0 ? [x - 1, y] : [x - 1, y];
    }
}

function getRandomNeighbourPosition(x, y) {
    let positions = ["topLeft", "topRight", "right", "bottomRight", "bottomLeft", "left"];
    let position = positions[Math.floor(Math.random() * positions.length)];
    return getNeighbourCellPosition(position, x, y);
}

function shuffleArray(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function newText(x, y, text, fsize, ff, fstyle, color) {
    return new Konva.Text({
        x: x,
        y: y,
        text: text,
        fontSize: fsize,
        fontFamily: ff,
        fontStyle: fstyle,
        fill: color
    })
}

function drawKafkaIcon(x = 0, y = 0, color = "black") {
    return new Konva.Shape({
        x,
        y,
        fill: color,
        stroke: color,
        sceneFunc: ctx => {
            ctx.save();
            ctx.fillStyle = color;
            ctx.transform(1.000000, 0.000000, 0.000000, 1.000000, 0.000000 + x, -250 + y);
            ctx.beginPath();
            ctx.moveTo(8.259028, 296.962500);
            ctx.bezierCurveTo(6.774697, 296.905900, 5.364948, 296.379150, 4.208642, 295.449010);
            ctx.bezierCurveTo(4.027629, 295.303410, 3.630233, 294.926490, 3.479973, 294.757890);
            ctx.bezierCurveTo(2.631753, 293.806150, 2.124409, 292.704680, 1.963011, 291.464460);
            ctx.bezierCurveTo(1.937347, 291.267170, 1.933671, 291.180460, 1.933377, 290.762890);
            ctx.bezierCurveTo(1.933005, 290.242670, 1.942197, 290.128760, 2.019086, 289.699990);
            ctx.bezierCurveTo(2.448399, 287.306100, 4.411863, 285.325200, 6.938275, 284.737160);
            ctx.lineTo(7.130681, 284.692360);
            ctx.lineTo(7.130671, 282.822440);
            ctx.lineTo(7.130659, 280.952510);
            ctx.lineTo(6.957831, 280.923810);
            ctx.bezierCurveTo(6.724467, 280.885110, 6.180111, 280.755250, 5.924065, 280.677270);
            ctx.bezierCurveTo(2.819308, 279.731810, 0.553920, 277.229140, 0.080423, 274.221540);
            ctx.bezierCurveTo(0.011494, 273.783700, 0.001833, 273.637640, 0.002379, 273.041890);
            ctx.bezierCurveTo(0.002934, 272.449560, 0.010150, 272.341980, 0.080654, 271.884010);
            ctx.bezierCurveTo(0.387849, 269.887030, 1.505743, 268.071490, 3.219851, 266.785690);
            ctx.bezierCurveTo(4.303546, 265.972780, 5.603783, 265.415720, 6.983965, 265.173000);
            ctx.lineTo(7.065536, 265.158600);
            ctx.lineTo(7.062176, 263.386440);
            ctx.lineTo(7.058816, 261.614240);
            ctx.lineTo(6.987073, 261.597840);
            ctx.bezierCurveTo(5.357251, 261.224010, 3.927132, 260.277190, 3.005280, 258.961640);
            ctx.bezierCurveTo(2.472954, 258.201990, 2.129224, 257.356130, 1.992070, 256.468300);
            ctx.bezierCurveTo(1.939271, 256.126510, 1.932540, 256.024560, 1.932540, 255.565290);
            ctx.bezierCurveTo(1.932540, 255.105710, 1.939160, 255.004150, 1.992217, 254.661240);
            ctx.bezierCurveTo(2.241213, 253.049550, 3.175149, 251.581900, 4.580348, 250.594080);
            ctx.bezierCurveTo(6.170449, 249.476280, 8.209627, 249.089460, 10.153769, 249.536820);
            ctx.bezierCurveTo(10.983577, 249.727760, 11.808433, 250.092610, 12.498688, 250.573990);
            ctx.bezierCurveTo(12.876805, 250.837680, 13.295106, 251.201810, 13.587047, 251.521410);
            ctx.bezierCurveTo(14.950719, 253.014280, 15.480280, 254.999090, 15.027390, 256.919870);
            ctx.bezierCurveTo(14.796386, 257.899590, 14.297960, 258.829890, 13.586562, 259.609150);
            ctx.bezierCurveTo(13.418837, 259.792890, 13.067231, 260.122090, 12.870135, 260.279970);
            ctx.bezierCurveTo(12.206096, 260.811830, 11.454818, 261.208000, 10.620702, 261.466170);
            ctx.bezierCurveTo(10.483977, 261.508470, 10.270852, 261.566450, 10.147092, 261.594960);
            ctx.lineTo(9.922075, 261.646860);
            ctx.lineTo(9.922075, 263.392540);
            ctx.bezierCurveTo(9.922075, 264.778700, 9.925435, 265.139090, 9.938373, 265.142430);
            ctx.bezierCurveTo(9.947303, 265.144430, 10.066204, 265.166830, 10.202524, 265.191330);
            ctx.bezierCurveTo(11.689174, 265.459360, 13.067514, 266.096370, 14.229960, 267.052670);
            ctx.bezierCurveTo(14.448566, 267.232500, 14.801393, 267.565320, 14.989861, 267.769470);
            ctx.bezierCurveTo(15.075951, 267.862670, 15.164006, 267.957010, 15.185529, 267.978980);
            ctx.lineTo(15.224659, 268.018880);
            ctx.lineTo(16.763874, 267.005870);
            ctx.bezierCurveTo(17.610442, 266.448720, 18.304742, 265.988230, 18.306765, 265.982530);
            ctx.bezierCurveTo(18.308865, 265.976530, 18.287015, 265.887530, 18.258355, 265.783900);
            ctx.bezierCurveTo(18.110542, 265.249500, 18.048923, 264.789730, 18.048923, 264.221170);
            ctx.bezierCurveTo(18.048923, 263.760030, 18.088913, 263.377680, 18.180084, 262.967070);
            ctx.bezierCurveTo(18.405375, 261.952460, 18.880231, 261.036850, 19.601882, 260.225600);
            ctx.bezierCurveTo(19.776861, 260.028900, 20.174062, 259.656380, 20.390672, 259.485810);
            ctx.bezierCurveTo(21.430789, 258.666800, 22.644275, 258.183190, 24.010134, 258.043360);
            ctx.bezierCurveTo(24.177025, 258.026260, 24.327917, 258.021460, 24.681926, 258.021660);
            ctx.bezierCurveTo(25.170131, 258.022070, 25.344302, 258.034060, 25.745054, 258.094860);
            ctx.bezierCurveTo(27.362534, 258.340280, 28.829523, 259.145910, 29.862084, 260.355850);
            ctx.bezierCurveTo(30.645092, 261.273360, 31.119725, 262.349420, 31.270590, 263.549170);
            ctx.bezierCurveTo(31.298970, 263.774870, 31.310100, 264.434320, 31.289720, 264.683470);
            ctx.bezierCurveTo(31.238060, 265.315400, 31.090824, 265.922570, 30.849329, 266.499600);
            ctx.bezierCurveTo(30.752719, 266.730440, 30.508827, 267.192730, 30.369146, 267.409780);
            ctx.bezierCurveTo(29.697392, 268.453590, 28.736665, 269.279620, 27.577805, 269.809780);
            ctx.bezierCurveTo(26.855210, 270.140350, 26.117799, 270.333540, 25.283854, 270.410800);
            ctx.bezierCurveTo(25.011531, 270.436100, 24.401488, 270.439300, 24.134054, 270.416800);
            ctx.bezierCurveTo(23.261932, 270.343700, 22.472620, 270.135480, 21.720819, 269.780070);
            ctx.bezierCurveTo(21.040949, 269.458660, 20.512146, 269.097910, 19.965439, 268.582530);
            ctx.lineTo(19.710177, 268.341890);
            ctx.lineTo(18.178340, 269.348400);
            ctx.bezierCurveTo(17.335830, 269.901970, 16.641582, 270.361610, 16.635565, 270.369800);
            ctx.bezierCurveTo(16.628965, 270.377800, 16.645465, 270.442900, 16.676905, 270.531290);
            ctx.bezierCurveTo(17.263064, 272.174560, 17.265394, 273.897960, 16.683705, 275.546400);
            ctx.bezierCurveTo(16.642205, 275.663970, 16.608055, 275.763920, 16.607825, 275.768450);
            ctx.bezierCurveTo(16.607590, 275.773450, 17.302987, 276.237870, 18.153163, 276.801490);
            ctx.lineTo(19.698938, 277.826240);
            ctx.lineTo(19.959827, 277.580020);
            ctx.bezierCurveTo(20.515698, 277.055400, 21.065069, 276.681870, 21.746925, 276.364950);
            ctx.bezierCurveTo(22.888211, 275.834500, 24.158086, 275.625910, 25.425478, 275.760720);
            ctx.bezierCurveTo(27.174701, 275.946800, 28.755377, 276.767990, 29.864024, 278.066630);
            ctx.bezierCurveTo(30.693361, 279.038100, 31.187076, 280.217900, 31.289738, 281.473590);
            ctx.bezierCurveTo(31.310108, 281.722760, 31.298938, 282.382210, 31.270608, 282.607900);
            ctx.bezierCurveTo(31.085730, 284.078120, 30.409464, 285.371420, 29.295666, 286.384830);
            ctx.bezierCurveTo(28.256028, 287.330760, 26.946948, 287.922560, 25.516794, 288.093160);
            ctx.bezierCurveTo(25.049512, 288.148960, 24.440638, 288.156460, 23.997108, 288.111960);
            ctx.bezierCurveTo(22.907331, 288.002660, 21.925537, 287.672620, 21.016437, 287.110080);
            ctx.bezierCurveTo(19.447613, 286.139340, 18.384986, 284.577070, 18.114626, 282.843850);
            ctx.bezierCurveTo(18.047486, 282.413440, 18.028656, 281.827600, 18.068386, 281.405640);
            ctx.bezierCurveTo(18.102336, 281.045190, 18.185903, 280.607120, 18.278276, 280.305300);
            ctx.bezierCurveTo(18.311756, 280.195890, 18.311766, 280.195650, 18.285776, 280.175840);
            ctx.bezierCurveTo(18.271386, 280.165040, 17.568926, 279.698170, 16.724733, 279.138590);
            ctx.bezierCurveTo(15.441470, 278.287960, 15.187077, 278.123920, 15.173019, 278.137970);
            ctx.bezierCurveTo(15.163819, 278.146970, 15.101799, 278.215270, 15.035289, 278.289170);
            ctx.bezierCurveTo(14.857154, 278.487160, 14.302405, 278.999980, 14.071968, 279.179690);
            ctx.bezierCurveTo(13.235520, 279.832010, 12.336649, 280.307980, 11.335370, 280.628750);
            ctx.bezierCurveTo(10.937176, 280.756310, 10.471452, 280.871300, 10.118957, 280.929070);
            ctx.lineTo(9.987375, 280.950670);
            ctx.lineTo(9.987375, 282.822480);
            ctx.lineTo(9.987375, 284.694280);
            ctx.lineTo(10.134125, 284.727880);
            ctx.bezierCurveTo(11.545031, 285.050950, 12.832296, 285.823240, 13.740149, 286.891300);
            ctx.bezierCurveTo(15.134793, 288.532060, 15.550460, 290.691320, 14.857034, 292.693190);
            ctx.bezierCurveTo(14.671037, 293.230140, 14.345633, 293.840270, 13.995508, 294.308540);
            ctx.bezierCurveTo(13.341835, 295.182770, 12.476181, 295.875250, 11.454884, 296.340940);
            ctx.bezierCurveTo(10.742710, 296.665670, 10.052795, 296.853180, 9.276449, 296.933010);
            ctx.bezierCurveTo(9.128241, 296.948210, 8.524936, 296.979410, 8.500301, 296.973110);
            ctx.bezierCurveTo(8.496731, 296.972200, 8.388120, 296.967110, 8.258978, 296.962310);
            ctx.moveTo(8.819941, 293.749710);
            ctx.bezierCurveTo(9.592335, 293.682710, 10.273971, 293.384620, 10.816149, 292.876820);
            ctx.bezierCurveTo(11.982522, 291.784430, 12.077175, 290.074740, 11.038152, 288.866850);
            ctx.bezierCurveTo(10.927840, 288.738610, 10.707473, 288.532200, 10.570451, 288.428780);
            ctx.bezierCurveTo(9.466531, 287.595600, 7.949529, 287.531530, 6.771953, 288.268340);
            ctx.bezierCurveTo(6.587058, 288.384000, 6.485055, 288.463960, 6.294742, 288.642200);
            ctx.bezierCurveTo(6.056620, 288.865210, 5.917430, 289.034850, 5.755534, 289.299330);
            ctx.bezierCurveTo(5.463698, 289.776100, 5.310900, 290.407970, 5.355822, 290.952260);
            ctx.bezierCurveTo(5.434642, 291.907270, 5.946457, 292.731720, 6.786687, 293.257170);
            ctx.bezierCurveTo(7.384823, 293.631210, 8.123535, 293.810170, 8.819941, 293.749710);
            ctx.moveTo(25.073403, 284.909660);
            ctx.bezierCurveTo(25.796397, 284.826560, 26.459821, 284.513560, 26.978130, 284.010720);
            ctx.bezierCurveTo(27.938073, 283.079440, 28.153442, 281.724670, 27.525431, 280.567960);
            ctx.bezierCurveTo(27.055227, 279.701900, 26.161534, 279.104020, 25.119821, 278.958610);
            ctx.bezierCurveTo(24.907739, 278.929010, 24.438174, 278.929110, 24.232032, 278.958910);
            ctx.bezierCurveTo(23.163844, 279.113030, 22.285701, 279.708560, 21.805748, 280.604330);
            ctx.bezierCurveTo(21.584158, 281.017920, 21.477018, 281.443530, 21.475147, 281.917680);
            ctx.bezierCurveTo(21.473747, 282.268400, 21.519007, 282.545830, 21.628135, 282.855720);
            ctx.bezierCurveTo(21.787537, 283.308410, 22.027378, 283.678110, 22.385693, 284.023460);
            ctx.bezierCurveTo(23.089607, 284.701900, 24.069280, 285.024930, 25.073403, 284.909660);
            ctx.moveTo(9.057651, 277.213800);
            ctx.bezierCurveTo(10.711569, 277.035390, 12.119409, 276.014520, 12.730152, 274.550740);
            ctx.bezierCurveTo(12.853747, 274.254510, 12.942220, 273.924950, 12.995795, 273.561150);
            ctx.bezierCurveTo(13.028395, 273.339830, 13.028695, 272.774390, 12.996351, 272.547130);
            ctx.bezierCurveTo(12.857596, 271.572340, 12.418190, 270.743440, 11.681087, 270.065980);
            ctx.bezierCurveTo(11.307488, 269.722620, 10.968013, 269.497630, 10.502684, 269.285020);
            ctx.bezierCurveTo(9.987606, 269.049670, 9.507572, 268.925390, 8.917776, 268.874690);
            ctx.bezierCurveTo(8.712453, 268.856990, 8.196122, 268.867690, 7.991616, 268.893590);
            ctx.bezierCurveTo(7.010916, 269.018410, 6.137935, 269.414720, 5.439520, 270.052130);
            ctx.bezierCurveTo(4.376342, 271.022450, 3.898714, 272.385950, 4.143989, 273.750490);
            ctx.bezierCurveTo(4.334438, 274.810010, 4.971909, 275.777540, 5.904493, 276.422500);
            ctx.bezierCurveTo(6.583884, 276.892360, 7.397401, 277.173560, 8.246606, 277.232090);
            ctx.bezierCurveTo(8.446179, 277.245890, 8.843446, 277.237090, 9.057651, 277.213690);
            ctx.moveTo(25.138626, 267.196390);
            ctx.bezierCurveTo(26.196494, 267.039300, 27.067439, 266.445160, 27.545203, 265.554680);
            ctx.bezierCurveTo(27.976636, 264.750550, 27.992463, 263.806270, 27.588363, 262.979510);
            ctx.bezierCurveTo(27.345776, 262.483200, 26.940971, 262.038110, 26.452745, 261.730910);
            ctx.bezierCurveTo(26.036752, 261.469150, 25.517551, 261.290940, 25.024996, 261.240850);
            ctx.bezierCurveTo(24.862162, 261.224250, 24.488922, 261.224250, 24.326087, 261.240850);
            ctx.bezierCurveTo(23.723680, 261.302050, 23.096487, 261.553460, 22.627553, 261.921540);
            ctx.bezierCurveTo(21.996555, 262.416830, 21.599678, 263.100040, 21.490452, 263.879070);
            ctx.bezierCurveTo(21.464322, 264.065480, 21.471042, 264.452600, 21.503912, 264.654860);
            ctx.bezierCurveTo(21.701870, 265.872670, 22.652301, 266.849640, 23.922825, 267.141310);
            ctx.bezierCurveTo(24.053993, 267.171310, 24.223931, 267.198310, 24.414655, 267.219310);
            ctx.bezierCurveTo(24.517491, 267.230110, 25.014217, 267.214310, 25.138625, 267.196410);
            ctx.moveTo(9.064597, 258.529590);
            ctx.bezierCurveTo(9.531775, 258.451490, 9.952515, 258.296000, 10.320061, 258.065890);
            ctx.bezierCurveTo(11.091708, 257.582790, 11.590591, 256.843300, 11.730915, 255.974600);
            ctx.bezierCurveTo(11.762415, 255.779540, 11.762355, 255.363510, 11.730772, 255.162150);
            ctx.bezierCurveTo(11.625757, 254.492430, 11.319673, 253.921790, 10.809917, 253.445380);
            ctx.bezierCurveTo(10.531372, 253.185040, 10.298148, 253.028400, 9.954814, 252.871090);
            ctx.bezierCurveTo(9.649611, 252.731240, 9.353469, 252.643430, 9.021667, 252.594390);
            ctx.bezierCurveTo(8.809536, 252.562990, 8.292544, 252.562990, 8.089450, 252.594300);
            ctx.bezierCurveTo(7.166240, 252.736620, 6.393818, 253.197340, 5.887550, 253.907660);
            ctx.bezierCurveTo(5.315081, 254.710870, 5.190255, 255.737350, 5.557111, 256.624970);
            ctx.bezierCurveTo(5.990689, 257.674010, 6.970631, 258.396080, 8.165020, 258.546580);
            ctx.bezierCurveTo(8.368342, 258.572180, 8.866250, 258.562780, 9.064597, 258.529580);

            ctx.fill();
            ctx.restore();
        }
    });
}

function shadeColor(color, percent) {  // deprecated. See below.
    var num = parseInt(color.slice(1), 16), amt = Math.round(2.55 * percent), R = (num >> 16) + amt,
        G = (num >> 8 & 0x00FF) + amt, B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

export default Dashboard;
