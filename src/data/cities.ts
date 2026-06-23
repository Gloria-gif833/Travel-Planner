/* ========================================
   全国城市数据源
   覆盖：23省 + 5自治区 + 4直辖市 + 2特别行政区
   包含：一二三线城市、小众旅行目的地
   ======================================== */

export interface City {
  name: string;
  /** 是否为热门/知名城市 */
  popular?: boolean;
  /** 是否为热门旅行目的地 */
  travelDestination?: boolean;
  /** 城市等级标签 */
  tier?: '一线' | '新一线' | '二线' | '三线';
}

export interface Province {
  name: string;
  cities: City[];
}

export const PROVINCES: Province[] = [
  // ===== 直辖市 =====
  {
    name: '北京',
    cities: [
      { name: '北京', popular: true, tier: '一线' },
    ],
  },
  {
    name: '上海',
    cities: [
      { name: '上海', popular: true, tier: '一线' },
    ],
  },
  {
    name: '天津',
    cities: [
      { name: '天津', popular: true, tier: '新一线' },
    ],
  },
  {
    name: '重庆',
    cities: [
      { name: '重庆', popular: true, tier: '新一线' },
      { name: '武隆', travelDestination: true },
      { name: '巫山', travelDestination: true },
    ],
  },

  // ===== 特别行政区 =====
  {
    name: '香港',
    cities: [
      { name: '香港', popular: true },
    ],
  },
  {
    name: '澳门',
    cities: [
      { name: '澳门', popular: true },
    ],
  },

  // ===== 23 省 =====

  // 河北
  {
    name: '河北',
    cities: [
      { name: '石家庄', tier: '三线' },
      { name: '唐山' },
      { name: '秦皇岛', travelDestination: true, tier: '三线' },
      { name: '邯郸' },
      { name: '保定' },
      { name: '张家口', travelDestination: true },
      { name: '承德', travelDestination: true },
      { name: '廊坊' },
      { name: '北戴河', travelDestination: true },
      { name: '白洋淀', travelDestination: true },
    ],
  },

  // 山西
  {
    name: '山西',
    cities: [
      { name: '太原', tier: '二线' },
      { name: '大同', travelDestination: true, tier: '三线' },
      { name: '平遥', travelDestination: true },
      { name: '五台山', travelDestination: true },
      { name: '晋中' },
      { name: '临汾' },
      { name: '运城' },
      { name: '长治' },
      { name: '壶口瀑布', travelDestination: true },
      { name: '云冈石窟', travelDestination: true },
    ],
  },

  // 辽宁
  {
    name: '辽宁',
    cities: [
      { name: '沈阳', popular: true, tier: '新一线' },
      { name: '大连', popular: true, tier: '二线' },
      { name: '鞍山' },
      { name: '抚顺' },
      { name: '丹东', travelDestination: true },
      { name: '锦州' },
      { name: '营口' },
      { name: '葫芦岛' },
    ],
  },

  // 吉林
  {
    name: '吉林',
    cities: [
      { name: '长春', tier: '二线' },
      { name: '吉林', tier: '三线' },
      { name: '延吉', travelDestination: true },
      { name: '长白山', travelDestination: true },
      { name: '通化' },
      { name: '松原' },
    ],
  },

  // 黑龙江
  {
    name: '黑龙江',
    cities: [
      { name: '哈尔滨', popular: true, tier: '二线' },
      { name: '齐齐哈尔' },
      { name: '牡丹江', travelDestination: true },
      { name: '漠河', travelDestination: true },
      { name: '伊春', travelDestination: true },
      { name: '黑河' },
      { name: '雪乡', travelDestination: true },
      { name: '大庆' },
      { name: '佳木斯' },
    ],
  },

  // 江苏
  {
    name: '江苏',
    cities: [
      { name: '南京', popular: true, tier: '新一线' },
      { name: '苏州', popular: true, tier: '新一线' },
      { name: '无锡', tier: '二线' },
      { name: '常州', tier: '三线' },
      { name: '扬州', travelDestination: true, tier: '三线' },
      { name: '镇江', travelDestination: true, tier: '三线' },
      { name: '南通', tier: '二线' },
      { name: '徐州', tier: '二线' },
      { name: '连云港' },
      { name: '盐城' },
      { name: '淮安' },
      { name: '周庄', travelDestination: true },
      { name: '同里', travelDestination: true },
    ],
  },

  // 浙江
  {
    name: '浙江',
    cities: [
      { name: '杭州', popular: true, tier: '新一线' },
      { name: '宁波', tier: '二线' },
      { name: '温州', tier: '二线' },
      { name: '绍兴', tier: '二线' },
      { name: '嘉兴', travelDestination: true, tier: '三线' },
      { name: '金华', tier: '三线' },
      { name: '湖州', tier: '三线' },
      { name: '台州', tier: '三线' },
      { name: '舟山', travelDestination: true },
      { name: '丽水', travelDestination: true },
      { name: '乌镇', travelDestination: true },
      { name: '西塘', travelDestination: true },
      { name: '普陀山', travelDestination: true },
      { name: '莫干山', travelDestination: true },
      { name: '千岛湖', travelDestination: true },
    ],
  },

  // 安徽
  {
    name: '安徽',
    cities: [
      { name: '合肥', tier: '新一线' },
      { name: '黄山', travelDestination: true, tier: '三线' },
      { name: '芜湖', tier: '三线' },
      { name: '蚌埠' },
      { name: '马鞍山' },
      { name: '安庆' },
      { name: '宏村', travelDestination: true },
      { name: '西递', travelDestination: true },
      { name: '九华山', travelDestination: true },
      { name: '歙县', travelDestination: true },
    ],
  },

  // 福建
  {
    name: '福建',
    cities: [
      { name: '福州', tier: '二线' },
      { name: '厦门', popular: true, tier: '二线' },
      { name: '泉州', popular: true, tier: '二线' },
      { name: '漳州', travelDestination: true },
      { name: '武夷山', travelDestination: true },
      { name: '宁德' },
      { name: '莆田' },
      { name: '龙岩' },
      { name: '鼓浪屿', travelDestination: true },
      { name: '霞浦', travelDestination: true },
      { name: '湄洲岛', travelDestination: true },
      { name: '土楼（永定/南靖）', travelDestination: true },
    ],
  },

  // 江西
  {
    name: '江西',
    cities: [
      { name: '南昌', tier: '二线' },
      { name: '九江', travelDestination: true, tier: '三线' },
      { name: '景德镇', travelDestination: true, tier: '三线' },
      { name: '庐山', travelDestination: true },
      { name: '婺源', travelDestination: true },
      { name: '三清山', travelDestination: true },
      { name: '井冈山', travelDestination: true },
      { name: '赣州', tier: '三线' },
      { name: '上饶', tier: '三线' },
      { name: '宜春' },
    ],
  },

  // 山东
  {
    name: '山东',
    cities: [
      { name: '济南', popular: true, tier: '二线' },
      { name: '青岛', popular: true, tier: '新一线' },
      { name: '烟台', travelDestination: true, tier: '二线' },
      { name: '威海', travelDestination: true, tier: '三线' },
      { name: '淄博', tier: '三线' },
      { name: '泰安', travelDestination: true, tier: '三线' },
      { name: '曲阜', travelDestination: true },
      { name: '日照', travelDestination: true },
      { name: '临沂' },
      { name: '潍坊', tier: '二线' },
      { name: '枣庄' },
      { name: '蓬莱', travelDestination: true },
    ],
  },

  // 河南
  {
    name: '河南',
    cities: [
      { name: '郑州', popular: true, tier: '新一线' },
      { name: '洛阳', travelDestination: true, tier: '二线' },
      { name: '开封', travelDestination: true, tier: '三线' },
      { name: '安阳' },
      { name: '新乡' },
      { name: '焦作', travelDestination: true },
      { name: '南阳' },
      { name: '信阳' },
      { name: '少林寺（登封）', travelDestination: true },
      { name: '老君山', travelDestination: true },
      { name: '红旗渠', travelDestination: true },
    ],
  },

  // 湖北
  {
    name: '湖北',
    cities: [
      { name: '武汉', popular: true, tier: '新一线' },
      { name: '宜昌', travelDestination: true, tier: '三线' },
      { name: '襄阳', tier: '三线' },
      { name: '十堰', travelDestination: true },
      { name: '恩施', travelDestination: true },
      { name: '神农架', travelDestination: true },
      { name: '武当山', travelDestination: true },
      { name: '荆州' },
      { name: '黄冈' },
      { name: '三峡', travelDestination: true },
    ],
  },

  // 湖南
  {
    name: '湖南',
    cities: [
      { name: '长沙', popular: true, tier: '新一线' },
      { name: '张家界', travelDestination: true, tier: '三线' },
      { name: '凤凰古城', travelDestination: true },
      { name: '衡阳' },
      { name: '岳阳', travelDestination: true },
      { name: '韶山', travelDestination: true },
      { name: '湘西（芙蓉镇）', travelDestination: true },
      { name: '郴州' },
      { name: '常德' },
      { name: '湘潭', tier: '三线' },
    ],
  },

  // 广东
  {
    name: '广东',
    cities: [
      { name: '广州', popular: true, tier: '一线' },
      { name: '深圳', popular: true, tier: '一线' },
      { name: '珠海', travelDestination: true, tier: '二线' },
      { name: '东莞', tier: '新一线' },
      { name: '佛山', tier: '新一线' },
      { name: '中山', tier: '二线' },
      { name: '惠州', travelDestination: true, tier: '三线' },
      { name: '汕头' },
      { name: '湛江' },
      { name: '韶关' },
      { name: '清远', travelDestination: true },
      { name: '阳江', travelDestination: true },
    ],
  },

  // 海南
  {
    name: '海南',
    cities: [
      { name: '海口', travelDestination: true, tier: '三线' },
      { name: '三亚', travelDestination: true, tier: '三线' },
      { name: '万宁', travelDestination: true },
      { name: '陵水', travelDestination: true },
      { name: '文昌', travelDestination: true },
      { name: '琼海', travelDestination: true },
      { name: '儋州' },
      { name: '博鳌', travelDestination: true },
    ],
  },

  // 四川
  {
    name: '四川',
    cities: [
      { name: '成都', popular: true, tier: '新一线' },
      { name: '九寨沟', travelDestination: true },
      { name: '稻城', travelDestination: true },
      { name: '色达', travelDestination: true },
      { name: '乐山', travelDestination: true, tier: '三线' },
      { name: '峨眉山', travelDestination: true },
      { name: '绵阳', tier: '三线' },
      { name: '都江堰', travelDestination: true },
      { name: '青城山', travelDestination: true },
      { name: '泸沽湖', travelDestination: true },
      { name: '康定', travelDestination: true },
      { name: '德阳' },
      { name: '宜宾' },
      { name: '南充' },
      { name: '广元' },
    ],
  },

  // 贵州
  {
    name: '贵州',
    cities: [
      { name: '贵阳', tier: '二线' },
      { name: '黄果树', travelDestination: true },
      { name: '黔东南（西江千户苗寨）', travelDestination: true },
      { name: '荔波', travelDestination: true },
      { name: '镇远古镇', travelDestination: true },
      { name: '梵净山', travelDestination: true },
      { name: '遵义', travelDestination: true },
      { name: '安顺', travelDestination: true },
      { name: '六盘水' },
      { name: '毕节' },
    ],
  },

  // 云南
  {
    name: '云南',
    cities: [
      { name: '昆明', popular: true, tier: '二线' },
      { name: '大理', travelDestination: true },
      { name: '丽江', travelDestination: true },
      { name: '香格里拉', travelDestination: true },
      { name: '西双版纳', travelDestination: true },
      { name: '腾冲', travelDestination: true },
      { name: '泸沽湖', travelDestination: true },
      { name: '普洱', travelDestination: true },
      { name: '红河（元阳梯田）', travelDestination: true },
      { name: '玉龙雪山', travelDestination: true },
      { name: '梅里雪山', travelDestination: true },
      { name: '曲靖' },
      { name: '玉溪' },
    ],
  },

  // 陕西
  {
    name: '陕西',
    cities: [
      { name: '西安', popular: true, tier: '新一线' },
      { name: '咸阳', tier: '三线' },
      { name: '延安', travelDestination: true },
      { name: '宝鸡' },
      { name: '华山', travelDestination: true },
      { name: '兵马俑（临潼）', travelDestination: true },
      { name: '汉中' },
      { name: '榆林' },
    ],
  },

  // 甘肃
  {
    name: '甘肃',
    cities: [
      { name: '兰州', tier: '二线' },
      { name: '敦煌', travelDestination: true },
      { name: '张掖', travelDestination: true },
      { name: '嘉峪关', travelDestination: true },
      { name: '天水', travelDestination: true },
      { name: '甘南', travelDestination: true },
      { name: '鸣沙山月牙泉', travelDestination: true },
      { name: '七彩丹霞', travelDestination: true },
    ],
  },

  // 青海
  {
    name: '青海',
    cities: [
      { name: '西宁', tier: '三线' },
      { name: '青海湖', travelDestination: true },
      { name: '茶卡盐湖', travelDestination: true },
      { name: '格尔木', travelDestination: true },
      { name: '祁连', travelDestination: true },
      { name: '德令哈', travelDestination: true },
      { name: '翡翠湖', travelDestination: true },
    ],
  },

  // 台湾
  {
    name: '台湾',
    cities: [
      { name: '台北', popular: true },
      { name: '高雄', travelDestination: true },
      { name: '台中', travelDestination: true },
      { name: '花莲', travelDestination: true },
      { name: '垦丁', travelDestination: true },
      { name: '台南', travelDestination: true },
    ],
  },

  // ===== 5 自治区 =====

  // 内蒙古
  {
    name: '内蒙古',
    cities: [
      { name: '呼和浩特', tier: '三线' },
      { name: '呼伦贝尔', travelDestination: true },
      { name: '阿拉善', travelDestination: true },
      { name: '乌兰察布' },
      { name: '鄂尔多斯', travelDestination: true },
      { name: '赤峰' },
      { name: '乌兰布统', travelDestination: true },
      { name: '额济纳旗', travelDestination: true },
      { name: '阿尔山', travelDestination: true },
      { name: '希拉穆仁草原', travelDestination: true },
    ],
  },

  // 广西
  {
    name: '广西',
    cities: [
      { name: '南宁', tier: '二线' },
      { name: '桂林', travelDestination: true, tier: '三线' },
      { name: '阳朔', travelDestination: true },
      { name: '北海', travelDestination: true, tier: '三线' },
      { name: '涠洲岛', travelDestination: true },
      { name: '柳州', travelDestination: true },
      { name: '德天瀑布', travelDestination: true },
      { name: '龙脊梯田', travelDestination: true },
      { name: '百色' },
      { name: '梧州' },
    ],
  },

  // 西藏
  {
    name: '西藏',
    cities: [
      { name: '拉萨', travelDestination: true },
      { name: '林芝', travelDestination: true },
      { name: '日喀则', travelDestination: true },
      { name: '珠峰大本营', travelDestination: true },
      { name: '纳木错', travelDestination: true },
      { name: '羊卓雍措', travelDestination: true },
      { name: '阿里', travelDestination: true },
      { name: '墨脱', travelDestination: true },
    ],
  },

  // 宁夏
  {
    name: '宁夏',
    cities: [
      { name: '银川', tier: '三线' },
      { name: '中卫', travelDestination: true },
      { name: '沙坡头', travelDestination: true },
      { name: '西夏王陵', travelDestination: true },
      { name: '镇北堡影视城', travelDestination: true },
      { name: '石嘴山' },
    ],
  },

  // 新疆
  {
    name: '新疆',
    cities: [
      { name: '乌鲁木齐', tier: '三线' },
      { name: '喀纳斯', travelDestination: true },
      { name: '吐鲁番', travelDestination: true },
      { name: '伊犁', travelDestination: true },
      { name: '喀什', travelDestination: true },
      { name: '禾木', travelDestination: true },
      { name: '赛里木湖', travelDestination: true },
      { name: '独库公路', travelDestination: true },
      { name: '那拉提草原', travelDestination: true },
      { name: '库尔勒' },
      { name: '阿克苏' },
      { name: '哈密' },
    ],
  },
];

/**
 * 获取所有城市名列表（平铺，用于搜索）
 */
export function getAllCities(): { name: string; province: string }[] {
  const result: { name: string; province: string }[] = [];
  for (const province of PROVINCES) {
    for (const city of province.cities) {
      result.push({ name: city.name, province: province.name });
    }
  }
  return result;
}

/**
 * 获取热门/推荐城市列表
 */
export function getPopularCities(): { name: string; province: string }[] {
  const result: { name: string; province: string }[] = [];
  for (const province of PROVINCES) {
    for (const city of province.cities) {
      if (city.popular || city.travelDestination) {
        result.push({ name: city.name, province: province.name });
      }
    }
  }
  return result;
}