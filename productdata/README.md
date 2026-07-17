# productdata — 商品资料维护区

以后你只维护这个文件夹，不需要改页面代码。

## 重要说明（Cloudflare）

Cloudflare Pages 是静态托管，**线上网站无法自动列出文件夹里的文件**。  
本站在打包时用 `tools/build-data-index.ps1` 扫描 `productdata`，生成：

- `products-index.json`
- `catalogs-index.json`

所以：**改了产品数量 / 增删文件夹之后，请重新运行打包脚本，再上传 zip。**

只换同名图片（例如仍叫 `cover.jpg`）时，重新打包上传即可，`info.json` 一般不用动。

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

1. 在 `products/new/` 或 `products/standard/` 下新建英文文件夹，例如 `summer-bra-001`。
2. 放入主图，命名为 `cover.jpg` / `cover.png` / `cover.webp`。
3. 复制其他产品的 `info.json`，改标题、描述、标签、`sort`。
4. 双击或运行 `tools/build-cloudflare-zip.cmd`，上传生成的 `gracelingerie-cloudflare.zip`。

## 删除产品

删除对应产品文件夹，然后重新打包上传。

## 替换图片

保持文件名仍为 `cover.*`，替换文件后重新打包上传。

## 维护站点文案

编辑 `site.json`（品牌名、WhatsApp、首屏标题等）和 `details.json`（细节区文案），然后重新打包。
