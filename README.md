# BurmeseLearner

A personal, non-commercial app for learning to understand and speak everyday Burmese (Yangon). Hosted on Firebase so it works on my phone.

- **[Vision & Roadmap](ROADMAP.md)**: what we're building and why
- [Research report](reports/Effective%20Burmese%20learning%20app.md): the evidence behind it
- [Romanization scheme](docs/romanization.md)
- [Deploy / install on phone](docs/deploy.md)

## Develop

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests
npm run validate   # content checks (Unicode/Zawgyi, tone marks, ids)
npm run build      # validate + type-check + production build
```

Content lives in `content/*.json`. Every item is a draft until checked by a native speaker (Partner mode in the app).
