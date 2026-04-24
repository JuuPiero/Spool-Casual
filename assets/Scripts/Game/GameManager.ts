import { _decorator, Color, Component, EventKeyboard, Input, input, JsonAsset, KeyCode, Node, sys } from 'cc';
import { GameConfig } from './GameConfigSA';
import { ServiceLocator } from '../ServiceLocator';
import { LevelData } from './LevelData';
import { EventBus } from '../EventBus';
import { GameEvent } from '../GameEvent';
import super_html_playable from '../super_html_playable';
import { LevelsConfig } from './LevelsConfig';
import { NewLevelData } from './NewLevelDataSA';
import { NavigationContainer } from '../Navigation/NavigationContainer';
import { SpoolManager } from './SpoolManager';
import { WoolManager } from './WoolManager';
import { SlotManager } from './SlotManager';
import { SCREENS } from './UI/Screens';
import { SoundManager } from '../SoundManager';
import { ETrackingEvent, TrackingManager } from '../TrackingManager';
const { ccclass, property } = _decorator;

export enum GameState {
    WIN,
    LOSE,
    PLAY
}
@ccclass('GameManager')
export class GameManager extends Component {
    @property(GameConfig)
    public gameConfig: GameConfig;

    // @property(LevelData)
    // public currentLevelData: LevelData


    @property(LevelsConfig)
    public levelsConfig: LevelsConfig = null

    @property(JsonAsset)
    public levelJson: JsonAsset = null


    // @property(NewLevelData)
    public newLevelData: NewLevelData = null


    public state: GameState = GameState.PLAY

    public speedMultiplier = .025

    @property(SpoolManager) public spoolManager: SpoolManager = null
    @property(WoolManager) public woolManager: WoolManager = null
    @property(SlotManager) public slotManager: SlotManager = null


    protected onEnable(): void {
        if (sys.os == sys.OS.WINDOWS) {
            input.on(Input.EventType.KEY_DOWN, this.onPressButton, this);
        }

        EventBus.on(GameEvent.NEW_GAME, this.onNewGame)
        EventBus.on(GameEvent.LEVEL_FAILED, this.onLose)
        EventBus.on(GameEvent.LEVEL_COMPLETED, this.installGame)

    }
    protected onDisable(): void {
        if (sys.os == sys.OS.WINDOWS) {
            input.off(Input.EventType.KEY_DOWN, this.onPressButton, this);
        }

        EventBus.off(GameEvent.NEW_GAME, this.onNewGame)
        EventBus.off(GameEvent.LEVEL_FAILED, this.onLose)
        EventBus.off(GameEvent.LEVEL_COMPLETED, this.installGame)

    }

    onPressButton(eventKeyboard: EventKeyboard) {
        if (eventKeyboard.keyCode == KeyCode.F12) {
            EventBus.emit(GameEvent.TOGGLE_VIDEO);
        }
    }


    public loadLevel() {
        const rawData = this.levelJson.json; 
        const levelData = Object.assign(new NewLevelData(), rawData);
        this.newLevelData = levelData
    }

    protected onLoad(): void {
        if (this.gameConfig) {
            ServiceLocator.register(GameConfig, this.gameConfig)
            ServiceLocator.register(GameManager, this)
        }
        this.setupLinkStore()
        this.loadLevel()
    
    }
    protected start(): void {
       EventBus.emit(GameEvent.NEW_GAME)
    }

    onNewGame = () => {
        TrackingManager.TrackEvent(ETrackingEvent.LOADING)
        this.spoolManager.init(this.newLevelData)
        this.woolManager.init(this.newLevelData)
        this.slotManager.init(this.newLevelData)
        SoundManager.instance.playMusic("BGM", true)
        TrackingManager.TrackEvent(ETrackingEvent.LOADED)
        TrackingManager.TrackEvent(ETrackingEvent.DISPLAYED)

    }
    onLose = () => {
        ServiceLocator.get(NavigationContainer).stack.navigate(SCREENS.ENDCARD)
        super_html_playable.game_end()
        super_html_playable.download()
        SoundManager.instance.stopMusic()
        TrackingManager.TrackEvent(ETrackingEvent.CHALLENGE_FAILED)
    }

    setupLinkStore() {
        super_html_playable.set_google_play_url(this.gameConfig.storeUrl)

    }

    installGame = () => {
        ServiceLocator.get(NavigationContainer).stack.navigate(SCREENS.ENDCARD)
        super_html_playable.game_end()
        super_html_playable.download()
    }
}
