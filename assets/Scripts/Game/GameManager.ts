import { _decorator, Component, JsonAsset, Node, sys } from 'cc';
import { GameConfig } from './GameConfigSA';
import { ServiceLocator } from '../ServiceLocator';
import { LevelData } from './LevelData';
import { EventBus } from '../EventBus';
import { GameEvent } from '../GameEvent';
import super_html_playable from '../super_html_playable';
import { LevelsConfig } from './LevelsConfig';
import { NewLevelData } from './NewLevelDataSA';
const { ccclass, property } = _decorator;

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

    // @property(Node) tutorial: Node = null


    public loadLevel() {
        const rawData = this.levelJson.json; // object thường
        const levelData = Object.assign(new NewLevelData(), rawData); // chuyển thành instance của LevelData
        this.newLevelData = levelData

        console.log(this.newLevelData);
        // this.levelConfig.addLevel(levelData);
        // this.levelConfig.saveAsset()
        // return levelData

    }

    protected onLoad(): void {
        if (this.gameConfig) {
            ServiceLocator.register(GameConfig, this.gameConfig)
            ServiceLocator.register(GameManager, this)
        }
        super_html_playable.set_google_play_url(this.gameConfig.storeUrl)

        EventBus.on(GameEvent.LEVEL_COMPLETED, this.installGame)
    }

    protected start(): void {
        this.loadLevel()
    }

    installGame = () => {
        super_html_playable.download()
        // sys.openURL(this.gameConfig.storeUrl)
        // ServiceLocator.get(NavigationContainer).stack.navigate('EndgameScreen')
    }
}
