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

    @property(LevelData)
    public currentLevelData: LevelData


    @property(LevelsConfig)
    public levelConfig: LevelsConfig = null

    @property(JsonAsset)
    public levelJson: JsonAsset = null


    @property(NewLevelData)
    public newLevelData: NewLevelData = null


    public colorMap: Map<number, Color> = new Map<number, Color>();

    // @property(Node) tutorial: Node = null

    public state: GameState = GameState.PLAY


    @property(SpoolManager) public spoolManager: SpoolManager = null


    protected onEnable(): void {
        if (sys.os == sys.OS.WINDOWS) {
            input.on(Input.EventType.KEY_DOWN, this.onPressButton, this);
        }
    }
    protected onDisable(): void {
        if (sys.os == sys.OS.WINDOWS) {
            input.off(Input.EventType.KEY_DOWN, this.onPressButton, this);
        }
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
        for (const colorHex of this.newLevelData.colorHexCodes) {
            const color: Color = new Color();
            Color.fromHEX(color, colorHex.Item2)
            this.colorMap.set(colorHex.Item1, color);
        }
    }

    protected onLoad(): void {
        if (this.gameConfig) {
            ServiceLocator.register(GameConfig, this.gameConfig)
            ServiceLocator.register(GameManager, this)
        }
        super_html_playable.set_google_play_url(this.gameConfig.storeUrl)

        EventBus.on(GameEvent.LEVEL_COMPLETED, this.installGame)
        this.loadLevel()
        // this.spoolManager.init(this.newLevelData)
    
    }

    protected start(): void {
    }

    installGame = () => {
        ServiceLocator.get(NavigationContainer).stack.navigate('EndCard')
        super_html_playable.game_end()
        super_html_playable.download()

    }

    public getLevelColor(colorNum: number): Color {
        return this.colorMap.get(colorNum)
    }

    
}
