# productdata — 商品资料维护区

以后你只维护这个文件夹，不需要改页面代码。  
更新网站：改这里的资料 →（必要时）生成索引 → `git push` 到 GitHub。

Full-Cup 系列可从 Excel 重新导入（不含价格）：

```powershell
python .\tools\import-fullcup-xlsx.py
.\tools\build-data-index.cmd
```

标准展示区按「系列 → 色系」展示：`products/standard/style-xxx/` + `colors/`。

## 重要说明

静态网站**无法自动列出文件夹里的文件**。  
增删产品后，请运行：

```text
tools/build-data-index.cmd
```

它会扫描本目录，生成：

- `products-index.json`
- `catalogs-index.json`

然后再 `git push`。只换同名 `cover` 图片时，一般不用重新生成索引。

## 目录结构

```text
productdata/
  site.json                 品牌、联系方式、首屏文案、检测摘要
  details.json              细节图区的文字（图片路径指向 details/）
  details/                  细节展示图
  products/
    new/                    新品区（只放最近主推）
      product-slug/
        cover.jpg|png|webp  主图（文件名必须是 cover）
        info.json           标题、描述、标签、排序
        gallery-*.jpg       可选附图
    standard/               常规长期展示产品
      product-slug/
        cover.jpg
        info.json
  catalogs/                 目录、检测报告、报价单等
    quality-report-xxx.pdf
    quality-report-xxx.json 可选，同名说明文件
  products-index.json       自动生成，勿手改
  catalogs-index.json       自动生成，勿手改
```

## 新增产品

1. 在 `products/new/` 或 `products/standard/` 下新建英文文件夹，例如 `summer-bra-001`
2. 放入主图，命名为 `cover.jpg` / `cover.png` / `cover.webp`
3. 复制其他产品的 `info.json`，改标题、描述、标签、`sort`
4. 运行 `tools/build-data-index.cmd`，再按根目录《更新github说明.md》推送

## 删除产品

删除对应产品文件夹，运行索引脚本，再 `git push`。

## 替换图片

保持文件名仍为 `cover.*`，替换后 `git push` 即可。

## 维护站点文案

编辑 `site.json`、`details.json`，然后 `git push`。
