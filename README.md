# GEO-AI-Machine-Learning-for-Paddy-Phenology-Classification

This is the code implementations of methods and models proposed in paper **xxxx** published in **xxxx**

### Abstract
Rice phenology information is essential for supporting precision agriculture systems, effective land management, and informed decision-making to ensure sustainable rice production. Indramayu Regency, as West Java's largest rice granary, faces critical food security challenges due to climate change impacts and increasing population demands. This study aimed to develop an accurate rice phenology classification model using Sentinel-1 SAR data combined with three machine learning algorithms: Random Forest (RF), Support Vector Machine (SVM), and Extreme Gradient Boosting (XGBoost), processed through Google Earth Engine and Google Colab platforms. This approach addresses the limitations of traditional field surveys and cloud-affected optical satellite imagery. The research was conducted from December 2024 to February 2025 at the Research Center for Information Data Science (PRSDI), National Research Agency (BRIN) Bandung, focusing on rice fields in Indramayu Regency. The study utilized polarization indices including Ratio Polarization Index (RPI), Average Polarization Index (API), Normalized Difference Polarization Index (NDPI), and Radar Vegetation Index (RVI) as predictor variables. All algorithms were optimized through hyperparameter tuning to achieve maximum classification performance. Results demonstrated that RF achieved the highest accuracy at 97%, followed by XGBoost at 96%, while SVM performed poorly with only 47% accuracy. However, XGBoost failed to effectively classify the vegetative phase 2 of rice growth. The spatial-temporal analysis revealed that rice phenology phases in Indramayu Regency during the first planting season of 2024 varied significantly across 10-day periods, influenced by environmental conditions, planting schedules, and algorithm performance characteristics. This research provides a robust framework for real-time, spatially-explicit rice phenology monitoring every 10 days, contributing significantly to data-driven precision agriculture development and overcoming traditional monitoring limitations.

### Work Flow
![(how to do)](https://github.com/user-attachments/assets/f884a4f9-1423-43d2-b76f-88e65706d7cc)

### Extra Files
The trained model and sample images are also available at:

- Image dataset: [projects/ee-bayuardianto104/assets/Dataset_S1_ARD_Indramayu_2024](https://code.earthengine.google.com/?asset=projects/ee-bayuardianto104/assets/Dataset_S1_ARD_Indramayu_2024)
- Train sample: https://drive.google.com/file/d/1VirZvHdqMce4kKA3bD_w59hd7p3_Y7qI/view
